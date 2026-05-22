// middlewares/validateUuid.js
const validate = require('uuid-validate');

const validateUuid = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName] || req.body[paramName];
        
        if (!id || !validate(id, 4)) { // التحقق من UUID v4
            return res.status(400).json({ 
                error: `المعرف المرسل (${paramName}) غير صالح.` 
            });
        }
        next();
    };
};

module.exports = validateUuid;