const classes = [];

const generateId = () => Math.random().toString(36).substring(2, 10);

exports.renderList = (req, res) => {
  const message = req.query.message || null;
  res.render("classes", { classes, message, errorMessage: null });
};

exports.renderForm = (req, res) => {
  res.render("class_form", { errorMessage: null, values: {} });
};

exports.create = (req, res) => {
  const { name, instructor, level, date, time } = req.body;

  const levels = ["beg", "inter", "advanced"];
  const hasEmpty = !name || !instructor || !level || !date || !time;
  const invalidLevel = !levels.includes(level);
  const dateTime = new Date(`${date}T${time}`);
  const invalidDateTime = isNaN(dateTime.getTime());

  if (hasEmpty || invalidLevel || invalidDateTime) {
    const errorMessage = "Please provide valid name, instructor, level, date, and time.";
    return res.status(400).render("class_form", {
      errorMessage,
      values: { name, instructor, level, date, time },
    });
  }

  const item = {
    id: generateId(),
    name,
    instructor,
    level,
    date,
    time,
    dateTimeISO: dateTime.toISOString(),
    createdAt: new Date().toISOString(),
  };

  classes.unshift(item);
  return res.redirect("/classes?message=Class%20created%20successfully");
};
