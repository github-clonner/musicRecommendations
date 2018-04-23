const Koa = require("koa");
const BodyParser = require("koa-bodyparser");
const Logger = require("koa-logger");
const Router = require("koa-router");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/musicRecommendations");

const Music = new Schema({
  name: { type: String, required: true, unique: true },
  tags: Array
});

const User = new Schema({
  username: { type: String, required: true, unique: true },
  listens: Array,
  following: Array
});

Music.plugin(uniqueValidator);
User.plugin(uniqueValidator);

const MusicModel = mongoose.model("Music", Music);
const UserModel = mongoose.model("User", User);

const app = new Koa();
const router = new Router();

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err;
    ctx.app.emit("error", err, ctx);
  }
});

router.get("/recommendations", async function(ctx) {
  ctx.body = {
    list: ["<music ID>", "<music ID>", "<music ID>", "<music ID>", "<music ID>"]
  };
});

router.post("/user/new", async function(ctx) {
  let newUser = await new UserModel(ctx.request.body);
  await newUser.save();
  ctx.body = newUser;
});

router.post("/music/new", async function(ctx) {
  let newMusic = await new MusicModel(ctx.request.body);
  await newMusic.save();
  ctx.body = newMusic;
});

router.post("/follow", async function(ctx) {
  const { body } = ctx.request;
  const to = await UserModel.findOne({ username: body.to });
  await UserModel.findOneAndUpdate(
    { username: body.from, following: { $ne: to._id } },
    { $push: { following: to._id } }
  );
  const from = await UserModel.findOne({ username: body.from });
  ctx.body = from;
});

router.post("/listen", async function(ctx) {
  const { body } = ctx.request;
  const music = await MusicModel.findOne({ name: body.music });
  await UserModel.findOneAndUpdate(
    { username: body.user },
    { $push: { listens: music._id } }
  );
  const user = await UserModel.findOne({ username: body.user });
  ctx.body = user;
});

app.use(Logger());
app.use(BodyParser());
app.use(router.routes());

app.listen(3000);
