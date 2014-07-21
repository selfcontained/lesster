
// detect a Less error and present a user-friendly message
module.exports = function prepareLessError(err) {
    if(!err.filename || !err.line) return err;

    return [
        'Less Error: ', err.message, ' in ', err.filename, ' on ', err.line
    ].join('');
};
