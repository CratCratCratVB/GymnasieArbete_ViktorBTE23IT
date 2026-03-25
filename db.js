const fs = require("fs").promises;

async function saveData(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 3));

}

async function getData(file) {
    try{
        const content = await fs.readFile(file, "utf8");
        return JSON.parse(content);
    }

    catch (err) {
        if (err.code === "ENOENT"){
            await fs.writeFile(file, "{}");
            return {};
        }
        throw err;
    }
}

module.exports = { getData, saveData }