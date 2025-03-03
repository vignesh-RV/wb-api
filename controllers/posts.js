const { db } = require('../config/db');

const savePost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const result = await db.query(
      `INSERT INTO posts.posts (title, content, created_by, last_modified_by) 
       VALUES ($1, $2, $3, $3) RETURNING *`,
      [title, content, req.user.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Save a comment
const saveComment = async (req, res) => {
  try {
    const { post_id, content, parent_comment_id } = req.body;
    const result = await db.query(
      `INSERT INTO posts.comments (post_id, content, parent_comment_id, created_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [post_id, content, parent_comment_id, req.user.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Helper function to build tree structure
const buildTree = (comments, parentId = null) => {
  return comments
    .filter(comment => comment.parent_comment_id === parentId)
    .map(comment => ({
      ...comment,
      comments: buildTree(comments, comment.comment_id)
    }));
};


const fetchAllPosts = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, p.created_date as "createdDate",
      (select count(1) from posts.comments c where c.post_id = p.post_id and c.parent_comment_id is null) as "commentCount",
       jsonb_build_object( 'user_id', u.user_id, 'firstName', u.first_name, 'lastName', u.last_name, 'email', u.email, 'phoneNumber', u.phone, 'profileImage', u.profile_image ) AS "postedBy" FROM posts.posts p JOIN users.users u ON u.user_id = p.created_by ORDER BY p.last_modified_date DESC`
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const fetchPostById = async (req, res) => {
  try {
    if(!req.params.post_id) return res.status(400).json({ message: 'Post ID is required' });

    const result = await db.query(
      `SELECT p.*, p.created_date as "createdDate",
      (select count(1) from posts.comments c where c.post_id = p.post_id and c.parent_comment_id is null) as "commentCount",
       jsonb_build_object( 'user_id', u.user_id, 'firstName', u.first_name, 'lastName', u.last_name, 'email', u.email, 'phoneNumber', u.phone, 'profileImage', u.profile_image ) AS "postedBy" FROM posts.posts p JOIN users.users u ON u.user_id = p.created_by WHERE p.post_id = $1 ORDER BY p.last_modified_date DESC`
    ,[req.params.post_id]);
    
    res.status(200).json(result.rows && result.rows.length ? result.rows[0] : []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Get comments by post ID in tree structure
const fetchComments = async (req, res) => {
  try {
    const { post_id } = req.params;
    const result = await db.query(
      `SELECT c.* ,
       c.created_date as "createdDate",
       jsonb_build_object( 'firstName', u.first_name, 'lastName', u.last_name, 'email', u.email, 'phoneNumber', u.phone, 'profileImage', u.profile_image ) AS "postedBy"
        FROM posts.comments c JOIN users.users u ON u.user_id = c.created_by WHERE c.post_id = $1 ORDER BY c.created_date ASC`,
      [post_id]
    );
    
    const commentsTree = buildTree(result.rows);
    res.status(200).json(commentsTree);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const updateVote = async (req, res) => {
  try {
    const { post_id, vote_type } = req.body;
    const currentVote = await db.query(
      `SELECT * FROM posts.votes WHERE post_id = $1 and created_by = $2 ORDER BY created_date ASC`,
      [post_id, req.user.user_id]
    );
    
    if( currentVote.rows.length > 0 ){
      await db.query(`Update posts.votes set vote_type = $1 WHERE vote_id = $2 `, [vote_type, currentVote.rows[0].vote_id]);
    } else {
      await db.query(`INSERT INTO posts.votes (post_id, vote_type, created_by, last_modified_by) VALUES ($1, $2, $3, $3)`, [post_id, vote_type, req.user.user_id]);
    }

    await db.query(`Update posts.posts set upvotes = ( select count(1) from posts.votes where post_id = $1 and vote_type = 'UP' ), 
      downvotes = (select count(1) from posts.votes where post_id = $1 and vote_type = 'DOWN' ) WHERE post_id = $1 `, [post_id]);

    res.status(200).json({ message: 'Vote updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports.savePost = savePost;
module.exports.fetchPostById = fetchPostById;
module.exports.fetchAllPosts = fetchAllPosts;
module.exports.saveComment = saveComment;
module.exports.fetchComments = fetchComments;
module.exports.updateVote = updateVote;