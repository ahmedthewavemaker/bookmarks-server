const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const { bookmarks } = require('../store')
const app = require('../app')
const bookmarksRouter = express.Router()
const jsonParser = express.json()



// route for /bookmarks
bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks)
    })
    .post(jsonParser, (req, res)=> {
        const { title, url, description, rating } = req.body;

        if(!title || !url) {
    return res
        .status(400)
        .send('Title or URL required')
}

if (rating < 0 || rating > 5) {
    return res
        .status(400)
        .send('must be between 1 -5')
}
const id = uuid();

const bookmark = {
    id,
    title,
    url,
    description,
    rating
}

bookmarks.push(bookmark);

logger.info(`Bookmark with id ${id} has been added`);
res
    .status(201)
    .location(`http://localhost:8000/bookmarks/${id}`)
    .json(bookmark)
    })


//routes for /bookmarks/id

bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res)=>{
        const {id} = req.params;

    const bookmark = bookmarks.find(b => b.id == id);

    if(!bookmark){
        return res  
                .status(404)
                .send('Bookmark not found')
    }
res.json(bookmark)


    })
    .delete((req,res)=>{
        const {id} = req.params;
    const bookmarkIndex = bookmarks.findIndex(b => b.id == id);

    if(bookmarkIndex ===  -1){
        logger.error(`Bookmar with id ${id} not found`);
        return res 
            .status(404)
            .send('Bookmark not found')
    }
    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} has beeen deleted`);
        res
            .status(204)
            .end();
    })

    module.exports = bookmarksRouter;