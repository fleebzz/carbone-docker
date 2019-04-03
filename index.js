const path = require(`path`);
const fs = require(`fs-extra`);
const util = require(`util`);
const carbone = require(`carbone`);
const express = require(`express`);
const bodyParser = require(`body-parser`);
const app = express();
const upload = require(`multer`)({ dest: `/tmp-reports/` });
const port = process.env.CARBONE_PORT || 3030;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const render = util.promisify(carbone.render);

app.get('/', (req, res) => {
  res.sendFile(path.resolve(`./test.html`));
});

app.post('/render', upload.single(`template`), async (req, res) => {
  const template = req.file;
  const originalNameWOExt = template.originalname.split(`.`).slice(0, -1).join(`.`);
  const originalFormat = template.originalname.split(`.`).reverse()[0];
  let data = req.body.data;
  const options = req.body.options || {};
  options.convertTo = options.convertTo || originalFormat;
  options.outputName = options.outputName || `${originalNameWOExt}.${format}`;
  if (typeof data !== `object` || data === null) {
    try {
      data = JSON.parse(req.body.data);
    } catch (e) {
      data = {};
    }
  }

  const report = await render(template.path, data, options);

  fs.remove(template.path);

  res.setHeader(`Content-Disposition`, `attachment; filename=${outputName}`);
  res.setHeader(`Content-Transfer-Encoding`, `binary`);
	res.setHeader(`Content-Type`, `application/octet-stream`);
  res.send(report);
});

app.listen(port, () => console.log(`Carbone wrapper listenning on port ${port}!`));
