const bcrypt = require('bcryptjs');
const { db } = require('../config/db');
const jwtUtils = require('../utils/jwt-utils');


const login = async (req, res) => {
    const { phoneNumber, password } = req.body;
    const result = await db.query("SELECT * FROM users.users where email = $1 or phone::text = $1 ", [phoneNumber]);
    if(result.rows.length === 0) {
        return res.status(400).json({ message: 'Unable to find your account..' });
    }
    let user = result.rows[0];
    
    const isMatch = await bcrypt.compare(atob(password), user.password_history[user.password_history.length - 1]);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }
  
    // Generate Access and Refresh Tokens
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);
  
    res.json({ accessToken, refreshToken, expiry: new Date().setMinutes(new Date().getMinutes() + parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION.replace('m','') )) });
}

const fetchCurrentUser = async (req, res) => {
    const result = await db.query("SELECT * FROM users.users where user_id = $1 ", [req.user.user_id]);
    if(result.rows.length === 0) {
        return res.status(400).json({ message: 'Unable to find your account..' });
    }
    let user = result.rows[0];
    
    res.json(user);
}

const createUser = async (req, res) => {
    const reqBody = req.body;
    const result = await db.query("SELECT * FROM users.users where email = $1 or (phone = $2 and phone != -1)", [reqBody.email, reqBody.phoneNumber]);
     
    // Check if user already exists
    if (result.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
  
    // Hash the password
    const hashedPassword = await bcrypt.hash(atob(reqBody.password), 10);
  
    // Store user in 'database'
    reqBody.password = hashedPassword;
    reqBody.source = 'APP';
    const { firstName, lastName, phoneNumber, email, password, profile_image, source } = reqBody;
    const query = `
      INSERT INTO users."users" 
      (first_name, last_name, phone, email, password_history, profile_image, source) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *;
    `;

    const values = [firstName, lastName, phoneNumber, email, [password], profile_image, source];
    const newUser = await db.query(query, values);
  
    res.status(201).json({ data: newUser ? newUser.rows : [{}], message: 'User created successfully' });
}

const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
  
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }
  
    try {
      // Verify the refresh token
      const userData = jwtUtils.verifyRefreshToken(refreshToken);
  
      if (!userData) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }
  
      // Generate a new access token
      const user = { user_id: userData.user_id, email: userData.email };
      const accessToken = jwtUtils.generateAccessToken(user);
  
      res.json({ accessToken , expiry: new Date().setMinutes(new Date().getMinutes() + parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION.replace('m','') )) });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
}

const updateUserData = async (req, res) => {
    const {key, value} = req.body;
    
    const query = `
      UPDATE users."users" 
      set ${key} = $1 where user_id = $2
      RETURNING *;
    `;
    if(!req.user){
        return res.status(400).json({ message: 'Unable to find your account..' });
    }

    const values = [value, req.user.user_id];
    const newUser = await db.query(query, values);
  
    res.status(201).json({ data: newUser, message: 'User updated successfully' });
}

function generatePassword(length = 12) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

const generateTokenForSocialLogins = async (req, res) => {
  const {email} = req.body;
  const result = await db.query("SELECT * FROM users.users where email = $1", [email]);
  if(result.rows.length === 0) {
    req.body.phoneNumber = -1;
    req.body.firstName = req.body.given_name || req.body.name;
    req.body.lastName = req.body.family_name,
    req.body.password = btoa(generatePassword(8));
    req.body.profile_image = req.body.picture;
    req.body.source = 'GOOGLE';

    createUser(req, res);
    return;
  }else{
    
    let user = result.rows[0];
    // Generate Access and Refresh Tokens
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);
  
    res.json({ accessToken, refreshToken, expiry: new Date().setMinutes(new Date().getMinutes() + parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION.replace('m','') )) });

    return;
  }
}

const fetchUserStat = async (req, res) => {
  const result = await db.query(`select jsonb_build_object( 'posts', (select count(1) from posts.posts p where created_by = $1), 
'followers', (select count(1) from users.followers f where f.follower_id  = $1),
'followings', (select array_agg(f.follower_id)  from users.followers f where f.user_id = $1)
) as stats
`, [req.user.user_id]);
  if(result.rows.length === 0) {
      return res.status(400).json({ message: 'Unable to find your account..' });
  }
  let user = result.rows[0];
  
  res.json(user);
}

const updateFollowers = async (req, res) => {
  const {follower_id} = req.body;
  
  const result = await db.query("SELECT * FROM users.followers where user_id = $1 and is_active=true", [req.user.user_id]);
  let newFollower;
  if(result.rows.length === 0) {
    const query = `
      INSERT INTO users."followers" (user_id, follower_id) 
      VALUES ($1, $2) RETURNING *;
    `;
    const values = [req.user.user_id, follower_id];
    newFollower = await db.query(query, values);
  }else{
    const query = `
      UPDATE users."followers" 
      set is_active = false where user_id = $1 and follower_id = $2
      RETURNING *;
    `;
    const values = [req.user.user_id, follower_id];
    newFollower = await db.query(query, values);
  }

  res.status(201).json({ data: newFollower, message: 'Follower updated successfully' });
}

module.exports.createUser = createUser;
module.exports.login = login;
module.exports.fetchCurrentUser = fetchCurrentUser;
module.exports.refreshToken = refreshToken;
module.exports.updateUserData = updateUserData;
module.exports.generateTokenForSocialLogins = generateTokenForSocialLogins;
module.exports.fetchUserStat = fetchUserStat;
module.exports.updateFollowers = updateFollowers;