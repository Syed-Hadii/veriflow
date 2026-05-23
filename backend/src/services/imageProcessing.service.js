const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const getPythonExecutable = () => {
  const localVenvPython = path.join(
    __dirname,
    "..",
    "..",
    "..",
    ".venv",
    "Scripts",
    "python.exe",
  );

  return fs.existsSync(localVenvPython) ? localVenvPython : "python";
};

const generateBackImage = (
  frontPath,
  passportNo,
  givenName,
  personalNo,
  outputPath,
) => {
  const scriptPath = path.join(
    __dirname,
    "../scripts/generate_typographic_mask.py",
  );

  return new Promise((resolve, reject) => {
    const args = [
      scriptPath,
      frontPath,
      passportNo,
      givenName,
      personalNo,
      outputPath,
    ];

    execFile(
      getPythonExecutable(),
      args,
      { timeout: 30000 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("[imageProcessing] Python script error:", error);
          console.error("[imageProcessing] stderr:", stderr);
          reject(error);
          return;
        }

        if (stdout) {
          console.log("[imageProcessing] stdout:", stdout);
        }

        resolve(outputPath);
      },
    );
  });
};

module.exports = {
  generateBackImage,
};
