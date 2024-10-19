import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

let book_notes = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function getCurrentNotes() {
  const result = await db.query("SELECT * FROM book_notes");
  book_notes = result.rows;
  return book_notes;
}

app.get("/", async (req, res) => {
  const currentNotes = await getCurrentNotes();
  try {
    res.render("index.ejs", { posts: currentNotes });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});

app.get("/new", (req, res) => {
  res.render("modify.ejs", { heading: "New Post", submit: "Create Post" });
});

app.get("/edit/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const post = await db.query(`SELECT * FROM book_notes WHERE id = ${id}`);
    res.render("modify.ejs", {
      heading: "Edit Post",
      submit: "Update Post",
      post: post.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching post" });
  }
});

app.post("/api/posts", async (req, res) => {
  try {
    const title = req.body.title;
    const rating = req.body.rating;
    const content = req.body.content;
    const author = req.body.author;
    await db.query(
      "INSERT INTO book_notes (title,rating,description,author_name) VALUES ($1, $2, $3, $4)",
      [title, rating, content, author]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/posts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const title = req.body.title;
    const rating = req.body.rating;
    const content = req.body.content;
    const author = req.body.author;
    await db.query(
      "UPDATE book_notes SET title = $1, rating = $2, description = $3, author_name = $4 WHERE id = $5",
      [title, rating, content, author, id]
    );
    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: "Error updating post" });
  }
});

app.get("/api/posts/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (id) {
    await db.query("DELETE FROM book_notes WHERE id = $1", [id]);
    res.redirect("/");
  } else {
    res.status(500).json({ message: "Error deleting post" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
