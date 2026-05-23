const Template = require("../models/Template");
const slugify = require("slugify");

const parseMaybeJSON = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;

  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  return fallback;
};

const normalizeSide = (input = {}) => {
  const side = parseMaybeJSON(input, {}) || {};

  const elements = Array.isArray(side.elements)
    ? side.elements
    : Array.isArray(side.fields)
      ? side.fields
      : parseMaybeJSON(side.elements || side.fields, []) || [];

  return {
    backgroundImage: side.backgroundImage || "",
    width: Number(side.width) || 1000,
    height: Number(side.height) || 600,
    elements,
  };
};

const buildUniqueSlug = async (title, excludeId = null) => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;

  const existing = await Template.findOne({
    slug,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

  if (existing) {
    slug = `${baseSlug}-${Date.now()}`;
  }

  return slug;
};

const createTemplate = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      layoutMode,
      single,
      front,
      back,
      status,
      previewImage,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const finalLayoutMode = layoutMode === "dual" ? "dual" : "single";

    const normalizedSingle = normalizeSide(single || front || {});
    const normalizedFront = normalizeSide(front || single || {});
    const normalizedBack = normalizeSide(back || {});

    const slug = await buildUniqueSlug(title);

    const template = await Template.create({
      title,
      slug,
      description: description || "",
      category: category || "document",
      layoutMode: finalLayoutMode,
      previewImage: previewImage || "",
      single: finalLayoutMode === "single" ? normalizedSingle : {},
      front: finalLayoutMode === "dual" ? normalizedFront : {},
      back: finalLayoutMode === "dual" ? normalizedBack : {},
      status: status || "draft",
      createdBy: req.user._id,
      version: 1,
    });

    return res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getTemplates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      layoutMode,
      search,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (layoutMode) query.layoutMode = layoutMode;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageLimit = Math.max(parseInt(limit, 10) || 10, 1);

    const templates = await Template.find(query)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort("-createdAt")
      .limit(pageLimit)
      .skip((pageNumber - 1) * pageLimit);

    const total = await Template.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: templates,
      pagination: {
        page: pageNumber,
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };

    const template = await Template.findOne(query)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    const {
      title,
      description,
      category,
      layoutMode,
      single,
      front,
      back,
      status,
      previewImage,
    } = req.body;

    if (title && title !== template.title) {
      template.title = title;
      template.slug = await buildUniqueSlug(title, template._id);
    }

    if (description !== undefined) template.description = description;
    if (category !== undefined) template.category = category;
    if (status !== undefined) template.status = status;
    if (previewImage !== undefined) template.previewImage = previewImage;

    if (layoutMode) {
      template.layoutMode = layoutMode === "dual" ? "dual" : "single";
    }

    const finalLayoutMode = template.layoutMode;

    const normalizedSingle = normalizeSide(
      single || front || template.single || {},
    );
    const normalizedFront = normalizeSide(
      front || single || template.front || {},
    );
    const normalizedBack = normalizeSide(back || template.back || {});

    if (finalLayoutMode === "single") {
      template.single = normalizedSingle;
      template.front = {};
      template.back = {};
    } else {
      template.single = {};
      template.front = normalizedFront;
      template.back = normalizedBack;
    }

    template.updatedBy = req.user._id;
    template.version = (template.version || 1) + 1;

    const updatedTemplate = await template.save();

    return res.status(200).json({
      success: true,
      message: "Template updated successfully",
      data: updatedTemplate,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    await template.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
};
