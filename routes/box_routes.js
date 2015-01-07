'use strict';

var Box = require('../models/box');
var Post = require('../models/post');

module.exports = function(app, jwtAuth) {
  //get all boxes involed in
  app.get('/api/boxes', jwtAuth, function(req, res) {
    Box.find({members: {$elemMatch: {email: req.user.email}}}, function(err, data) {
      if (err) {
        console.log(err);
        return res.status(500).send('Cannot retrieve threads');
      }
      var response = [];
      data.forEach(function(box) {
        var key;
        box.members.forEach(function(member) {
          if (req.user.email === member.email) {
            key = member.urlKey;
          }
        });
        response.push({
          email: box.members[0].email,
          subject: box.subject,
          date: box.date,
          boxKey: box.boxKey,
          userKey: key
        });
      });
      res.json(response);
    });
  });
  
  app.post('/api/boxes', jwtAuth, function(req, res) {
    var post = new Post(req.body.post);
    var box = new Box();
    try {
      box.subject = req.body.subject;
      box.members = [{email: req.user.email, unread: 0}];
      req.body.members.forEach(member) {
        box.members.push({email: member, unread: 0});
      }
      box.thread = [post._id];
    }
  })

  //get box from personal url
  app.get('/api/n/:boxkey/:userkey', function(req, res) {
    Box.findOne({boxKey: req.params.boxkey, members: {$elemMatch: {urlKey: req.params.userkey}}}, function(err, data) {
      if (err) {
        console.log(err);
        return res.status(500).send('Cannot retrieve box');
      }
      res.json(data);
    });
  });

  //post to a box thread
  app.post('/api/n/:boxkey/:userkey', function(req, res) {
    Box.findOne({boxKey: req.params.boxkey}, function(err, current) {
      if (err) {
        console.log(err);
        return res.status(500).send('No box');
      }
      var newPost = {};
      current.members.forEach(function(member) { //TODO: add catch for creator post
        if (member.urlKey === req.params.userkey) {
          newPost.author = member.email;
        }
      });
      newPost.text = req.body.text;
      newPost.time = Date.now();
      current.thread.push(newPost);
      current.save();
      res.json({msg: 'success'});
    });
  });

  //edit a post in a box thread
  app.put('/api/n/:boxkey/:userkey', function(req, res) {
    Box.findOne({boxKey: req.params.boxkey}, function(err, current) {
      if (err) {
        console.log(err);
        return res.status(500).send('No box');
      }
      var author;
      current.members.forEach(function(member) { //TODO: redundant code with line 33
        if (member.urlKey === req.params.userkey) {
          author = member.email;
        }
      });
      var oldPost = current.thread[req.body.index];
      if (oldPost.author !== author) {
        return res.status(403).send('You cannot edit this post');
      }
      oldPost.text = req.body.text;
      current.thread[req.body.postIndex] = oldPost;
      current.save();
    });
  });

  //delete box TODO: take out this route, replace with leave box
  app.delete('/api/n/:boxkey/', jwtAuth, function(req, res) {
    Box.findOne({boxKey: req.params.boxkey}, function(err, current) {
      if (err) {
        console.log(err);
        return res.status(500).send('No box');
      }
      if (req.user.email !== current.creator.email) {
        return res.status(500).send('Cannot delete this box');
      }
      current.remove();
    });
  });
};
