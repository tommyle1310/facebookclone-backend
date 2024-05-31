const exclude = (obj, keys) => {
    for (let key of keys) {
        delete obj[key];
    }
    return obj;
}

module.exports = { exclude }