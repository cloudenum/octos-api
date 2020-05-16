module.exports = {
    deleteProperties: async (object, properties) => {
        const copy = { ...object }

        properties.forEach(property => {
            delete copy[property]
        });

        return copy
    }
}