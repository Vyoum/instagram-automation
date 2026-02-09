const subscribers = [];

exports.renderList = (req, res) => {
  const message = req.query.message || null;
  res.render("subscribers", { subscribers, message, errorMessage: null });
};
