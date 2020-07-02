const path = require(`path`);
const fs = require(`fs-extra`);
const util = require(`util`);
const carbone = require(`carbone`);
const telejson = require(`telejson`);
const express = require(`express`);
const bodyParser = require(`body-parser`);
const app = express();
const upload = require(`multer`)({ dest: `/tmp-reports/` });
const port = process.env.CARBONE_PORT || 3030;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const render = util.promisify(carbone.render);

const defaultFormatters = {...carbone.formatters};

app.get('/', (req, res) => {
  res.sendFile(path.resolve(`./test.html`));
});

app.post('/render', upload.single(`template`), async (req, res) => {
  const template = req.file;
  if(!template) {
    return res.status(400).send(`Template file required`);
  }

  const originalNameWOExt = template.originalname.split(`.`).slice(0, -1).join(`.`);
  const originalFormat = template.originalname.split(`.`).reverse()[0];
  let data = req.body.data;
  let options = {};
  let formatters = {};
  try {
    options = JSON.parse(req.body.options);
  } catch (e) {
    return res.status(400).send(`Can't parse options JSON: ${e}`);
  }
  options.convertTo = options.convertTo || originalFormat;
  options.outputName = options.outputName || `${originalNameWOExt}.${options.convertTo}`;
  if (typeof data !== `object` || data === null) {
    try {
      data = JSON.parse(req.body.data);
    } catch (e) {
      return res.status(400).send(`Can't parse data JSON: ${e}`);
    }
  }
  try {
    formatters = telejson.parse(req.body.formatters);
  } catch (e) {}

  // Removing previous custom formatters before adding new ones
  carbone.formatters = {...defaultFormatters};

  carbone.addFormatters(formatters);

  let report = null;

  try {
    report = await render(template.path, data, options);
  } catch (e) {
    console.log(e);
    return res.status(500).send(`Internal server error: ${e}`);
  }

  fs.remove(template.path);

  res.setHeader(`Content-Disposition`, `attachment; filename=${options.outputName}`);
  res.setHeader(`Content-Transfer-Encoding`, `binary`);
	res.setHeader(`Content-Type`, `application/octet-stream`);
  res.setHeader(`Carbone-Report-Name`, options.outputName);

  return res.send(report);
});

app.listen(port, () => console.log(`Carbone wrapper listenning on port ${port}!`));
