process.stdin.setEncoding("utf8");

process.stdin.on("data", async (data) => {
  try {
    const payload = JSON.parse(data.trim());
    process.stdout.write(JSON.stringify(payload) + "\n");
  } catch (e) {
    process.stderr.write("Invalid input\n");
  }
});
