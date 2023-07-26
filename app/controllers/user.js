require('dotenv').config()

const modelSchema = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const nodemailer = require("nodemailer");
const blogSchema = require('../models/blog')
const categorySchema = require('../models/category')
const tagSchema = require('../models/tags')
const fileUpload = require('express-fileupload');
const path = require('path')
const unirest = require('unirest')
const blog = require('../models/blog')
var apiCall = unirest("GET",
    "https://ip-geolocation-ipwhois-io.p.rapidapi.com/json/"
);
apiCall.headers({
    "x-rapidapi-host": "ip-geolocation-ipwhois-io.p.rapidapi.com",
    "x-rapidapi-key": "srclZqaa9imshAk9Xzz55u27oltLp1SqdiFjsnmva9PTpf2j3f"
});

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USERNAME,
        pass: process.env.PASSWORD,
    }
});

function reqController() {
    const _getRedirectUrl = (req) => {
        return req.user.role === 'Admin' ? '/adminhome' : '/'
    }
    return {

        update(req, res) {
            const {
                role,
                name,
                email
            } = req.user
            User = {
                role: role,
                name: name,
                email: email,
            }
            res.render('update', {
                User: User
            })
        },
        async updateuser(req, res) {
            try {
                console.log(req.body)
                const {
                    name,
                    password,
                    password2
                } = req.body

                if (password == password2) {
                    if (name && !password) {
                        await modelSchema.findById(req.user.id, (err, docs) => {
                            if (err) {
                                console.log(err)
                            }
                            docs.name = name
                            docs.save();
                            res.redirect(_getRedirectUrl(req))
                        })
                    } else if (name && password) {
                        console.log(req.user)

                        const hashPassword = await bcrypt.hash(password, 10);
                        modelSchema.findById(req.user.id, (err, docs) => {
                            if (err) {
                                console.log(err)
                            }
                            docs.name = name
                            docs.password = hashPassword
                            docs.save();

                            var mail = {
                                from: "noreply <no reply@gmail.com>", // sender address
                                to: req.user.email, // list of receivers
                                subject: "password Changed",
                                // Subject line
                                html: `<h2>Username : ${req.user.email}</h2>
                                    <h2>Password: ${password}</h2>
                                `
                            }
                            transporter.sendMail(mail, (err, result) => {
                                if (err) {
                                    console.log(err)

                                } else {
                                    console.log("Email Sent Successfully for password updation")
                                    res.redirect(_getRedirectUrl(req))
                                }
                            })
                        })
                        res.redirect(_getRedirectUrl(req))
                    }
                } else {
                    console.log("Password is not correct")
                    res.redirect('/update')

                }
            } catch (e) {
                console.log(e)
            }
        },
        home(req, res) {

            res.render('home')
        },
        async createBlog(req, res) {

            try {

                apiCall.end(async function (result) {
                    if (res.error) throw new Error(result.error);
                    const category = await categorySchema.find();
                    const tags = await tagSchema.find()

                    res.render('createBlog', {
                        categories: category,
                        tags: tags,
                        latitude: result.body.latitude,
                        longitude: result.body.longitude

                    })
                });
            } catch (err) {
                console.log(err)
                res.redirect('/')
            }

        },
        async postcreateBlog(req, res) {
            const {
                title,
                body,
                category,
                tag,
                active,
                latitude,
                longitude
            } = req.body

            tags = tag.split(" #")

            try {

                let targetFile = req.files.myImage;
                if (targetFile == null) {
                    res.redirect('/createBlog')
                }

                let uploadPath = process.cwd() + "/uploads/" + targetFile.name
                await targetFile.mv(uploadPath, (err) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("uploaded Successfully")
                    }
                })
                var tag_list = []
                for (let index = 0; index < tags.length; index++) {
                    var tag_name;
                    if (index == 0) {
                        tag_name = tags[index]
                    } else {
                        tag_name = '#' + tags[index]
                    }

                    const tag_data = await tagSchema.find({
                        name: tag_name
                    })
                    if (tag_data != '') {
                        tag_list.push(tag_data._id)

                    } else {

                        const new_tag = new tagSchema({
                            name: tag_name.trim(),
                            created_by: req.user.id,
                            updated_by: req.user.id,
                            slug: tag_name.replace(/\s+/g, '')
                        })
                        await new_tag.save().then((result) => {
                            console.log("tag Added Successfully")
                            tag_list.push(new_tag._id)
                        }).catch((err) => {
                            console.log("Error occured while adding new Tag")
                        })

                    }
                }
                const user_id = req.user.id
                const updated_by = req.user.id
                let blog = new blogSchema({
                    title: title,
                    is_active: active,
                    body: body,
                    user_id: user_id,
                    updated_by: updated_by,
                    category_id: category,
                    tag_id: tag_list,
                    image: targetFile.name,
                    location: {
                        coordinates: [longitude, latitude]
                    }

                })
                await blog.save().then((result) => {
                    console.log("Blog Added Successfully")
                    return res.redirect('/myBlog')
                }).catch((err) => {
                    console.log(err)
                    return res.redirect('/createBlog')
                })

                return res.redirect('/')

            } catch (err) {
                console.log(err)
                return res.redirect('/createBlog')
            }

        },
        async myBlog(req, res) {
            try {
                await blogSchema.find({
                    user_id: req.user.id
                }, async (err, docs) => {
                    if (err) {
                        console.log(err)
                        return res.redirect('/')
                    }
                    const categories = await categorySchema.find();
                    var loop = [];

                    for (let index = 0; index < categories.length; index++) {

                        const category = categories[index]
                        const cat = await blogSchema.byUserCategory(category._id, req.user.id, true)
                        if (cat != '') {
                            loop.push({
                                key: category.name,
                                value: cat.length
                            })
                        }
                    }
                    const tags = await tagSchema.find();

                    const active = await blogSchema.byUser(req.user.id, true)
                    const inactive = await blogSchema.byUser(req.user.id, false)
                    res.render('myBlog', {
                        blogs: docs,
                        category_list: categories,
                        active: active.length,
                        inactive: inactive.length,
                        categories: loop,
                        filter_category: "true",
                        categorie: categories,
                        tag_list: tags,
                        tags: tags

                    })

                })
            } catch (err) {
                console.log(err)
                return res.redirect('/')
            }
        },
        async updateBlog(req, res) {
            try {
                const id = req.params.id

                await blogSchema.findById(id, async (err, docs) => {
                    if (err) {
                        console.log(err)
                        return res.redirect('/updateBlog')
                    }
                    const categories = await categorySchema.find();
                    const tags = await tagSchema.find()
                    var tag_list = []
                    for (let index = 0; index < tags.length; index++) {
                        const tag = tags[index]
                        if (docs.tag_id.includes(tag._id)) {
                            tag_list.push(tag.name)
                        }
                    }
                    res.render('updateBlog', {
                        blog: docs,
                        categories: categories,
                        tags: tag_list

                    })
                })
            } catch (err) {
                console.log(err)
                return res.redirect('/updateBlog')
            }


        },
        async deleteBlog(req, res) {
            const id = req.params.id

            await blogSchema.findByIdAndDelete(id, (err, docs) => {
                if (err) {
                    console.log(err)
                    return res.redirect('/myBlog')
                }
                console.log("BLog deleted Successfully")
                return res.redirect('/myBlog')

            })
            return res.redirect('/myBlog')
        },
        async postUpdateBlog(req, res) {
            const {
                id,
                title,
                category,
                body,
                tags,
                active,
                image
            } = req.body

            let targetFile = image
            if (!req.files) {
                targetFile = image
            } else {
                targetFile = req.files.myImage
                let uploadPath = process.cwd() + "/uploads/" + targetFile.name
                await targetFile.mv(uploadPath, (err) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("uploaded Successfully")
                    }
                })
                targetFile = targetFile.name
            }
            var tags_list=tags.split(',')
            
           var tag_list=[]
            for (let index = 0; index < tags_list.length; index++) {
                var tag_name=tags_list[index]
                
                const tag_data = await tagSchema.find({
                    name: tag_name
                })
                if (tag_data != '') {
                    tag_list.push(tag_data._id)

                } else {

                    const new_tag = new tagSchema({
                        name: tag_name.trim(),
                        created_by: req.user.id,
                        updated_by: req.user.id,
                        slug: tag_name.replace(/\s+/g, '')
                    })
                    await new_tag.save().then((result) => {
                        console.log("tag Added Successfully")
                        tag_list.push(new_tag._id)
                    }).catch((err) => {
                        console.log("Error occured while adding new Tag")
                    })

                }
            }

            await blogSchema.findOneAndUpdate({
            _id: id
            }, {
                title: title,
                is_active: active,
                body: body,
                category_id: category,
                updated_by: req.user.id,
                tag_id:tag_list,
                image: targetFile
            }, (err, docs) => {
                if (err) {
                    console.log(err)
                    res.redirect('/myBlog')
                }
                console.log("Blog Updated")
                res.redirect('/myBlog')

            })

            return res.redirect('/myBlog')
        },
        async blogsPage(req, res) {
            const blogs = await blogSchema.byActive(true)
            const categories = await categorySchema.find()
            const tags = await tagSchema.find()
            res.render('blogsPage', {
                blogs: blogs,
                categories: categories,
                tags: tags
            })
        },
        async search(req, res) {
            var {
                dsearch
            } = req.body
            const categories = await categorySchema.find()
            const tags = await tagSchema.find()
            const blogs = await blogSchema.find({
                '$and': [{
                        '$or': [{
                            title: {
                                '$regex': dsearch
                            }
                        }, {
                            body: {
                                '$regex': dsearch
                            }
                        }]
                    },
                    {
                        is_active: true
                    }
                ]
            })

            res.render('blogsPage', {
                blogs: blogs,
                categories: categories,
                tags: tags
            })
        },
        async filter(req, res) {
            const {
                category
            } = req.body
            const categories = await categorySchema.find()
            const tags = await tagSchema.find()
            const cat = await blogSchema.find({
                '$and': [{
                        category_id: {
                            '$in': category
                        }
                    },
                    {
                        is_active: true
                    }
                ]

            })

            res.render('blogsPage', {
                blogs: cat,
                categories: categories,
                tags: tags

            })
        },
        async filterBlogByTag(req, res) {
            const {
                tag
            } = req.body
            const tags = await tagSchema.find()
            const categories = await categorySchema.find()
            const cat = await blogSchema.find({
                '$and': [{
                        tag_id: {
                            '$in': tag
                        }
                    },
                    {
                        is_active: true
                    }
                ]

            })

            res.render('blogsPage', {
                blogs: cat,
                categories: categories,
                tags: tags

            })
        },
        async filterMyBlog(req, res) {

            try {
                const {
                    filter
                } = req.body

                console.log(filter)
                await blogSchema.find({
                    user_id: req.user.id,
                    is_active: filter
                }, async (err, docs) => {
                    if (err) {
                        console.log(err)
                        return res.redirect('/')
                    }
                    const categories = await categorySchema.find();
                    var loop = [];

                    for (let index = 0; index < categories.length; index++) {

                        const category = categories[index]
                        const cat = await blogSchema.byUserCategory(category._id, req.user.id, true)
                        if (cat != '') {
                            loop.push({
                                key: category.name,
                                value: cat.length
                            })
                        }
                    }
                    const tags = await tagSchema.find();
                    var tag_loop = [];

                    for (let index = 0; index < tags.length; index++) {

                        const tag = tags[index]
                        const cat = await blogSchema.byUserTag(tag._id, req.user.id, true)
                        if (cat != '') {
                            loop.push({
                                key: tag.name,
                                value: cat.length
                            })
                        }
                    }
                    const active = await blogSchema.byUser(req.user.id, true)
                    const inactive = await blogSchema.byUser(req.user.id, false)
                    res.render('myBlog', {
                        blogs: docs,
                        category_list: categories,
                        active: active.length,
                        inactive: inactive.length,
                        categories: loop,
                        filter_category: filter,
                        categorie: categories,
                        tag_list: tags,
                        tags: tags

                    })

                })
            } catch (err) {
                console.log(err)
                return res.redirect('/')
            }

        },
        async filterByCategoryMyBlog(req, res) {

            try {
                const {
                    category
                } = req.body

                await blogSchema.find({
                    user_id: req.user.id,
                    category_id: category
                }, async (err, docs) => {
                    if (err) {
                        console.log(err)
                        return res.redirect('/')
                    }
                    const categories = await categorySchema.find();
                    var loop = [];

                    for (let index = 0; index < categories.length; index++) {

                        const category = categories[index]
                        const cat = await blogSchema.byUserCategory(category._id, req.user.id, true)
                        if (cat != '') {
                            loop.push({
                                key: category.name,
                                value: cat.length
                            })
                        }
                    }
                    const tags = await tagSchema.find()
                    const active = await blogSchema.byUser(req.user.id, true)
                    const inactive = await blogSchema.byUser(req.user.id, false)
                    res.render('myBlog', {
                        blogs: docs,
                        category_list: categories,
                        active: active.length,
                        inactive: inactive.length,
                        categories: loop,
                        filter_category: "true",
                        categorie: categories,
                        tag_list: tags,
                        tags: tags


                    })

                })
            } catch (err) {
                console.log(err)
                return res.redirect('/')
            }


        },
        async filterByTagMyBlog(req, res) {

            try {
                const {
                    tag
                } = req.body

                await blogSchema.find({
                    user_id: req.user.id,
                    tag_id: tag
                }, async (err, docs) => {
                    if (err) {
                        console.log(err)
                        return res.redirect('/')
                    }
                    const categories = await categorySchema.find();
                    const tags = await tagSchema.find();

                    var loop = [];

                    for (let index = 0; index < categories.length; index++) {

                        const category = categories[index]
                        const cat = await blogSchema.byUserCategory(category._id, req.user.id, true)
                        if (cat != '') {
                            loop.push({
                                key: category.name,
                                value: cat.length
                            })
                        }
                    }
                    const active = await blogSchema.byUser(req.user.id, true)
                    const inactive = await blogSchema.byUser(req.user.id, false)
                    res.render('myBlog', {
                        blogs: docs,
                        category_list: categories,
                        active: active.length,
                        inactive: inactive.length,
                        categories: loop,
                        filter_category: "true",
                        categorie: categories,
                        tags: tags,
                        tag_list: tags
                    })

                })
            } catch (err) {
                console.log(err)
                return res.redirect('/')
            }


        },
        async searchMyBlog(req, res) {
            var {
                dsearch
            } = req.body
            const categories = await categorySchema.find()
            const blogs = await blogSchema.find({
                '$and': [{
                        '$or': [{
                            title: {
                                '$regex': dsearch
                            }
                        }, {
                            body: {
                                '$regex': dsearch
                            }
                        }]
                    },
                    {
                        is_active: true
                    }, {
                        user_id: req.user.id
                    }
                ]
            })
            const active = await blogSchema.byUser(req.user.id, true)
            const inactive = await blogSchema.byUser(req.user.id, false)
            var loop = [];
            const tags = await tagSchema.find()
            for (let index = 0; index < categories.length; index++) {

                const category = categories[index]
                const cat = await blogSchema.byUserCategory(category._id, req.user.id, true)
                if (cat != '') {
                    loop.push({
                        key: category.name,
                        value: cat.length
                    })
                }
            }

            res.render('myBlog', {
                blogs: blogs,
                category_list: categories,
                active: active.length,
                inactive: inactive.length,
                categories: loop,
                filter_category: "true",
                categorie: categories,
                tag_list: tags,
                tags: tags

            })

        },
        async filterBlogPagebyLocation(req, res) {
            const {
                lat,
                long,
                dist
            } = req.body

            const blogs = await blogSchema.find({
                location: {
                    $nearSphere: [long, lat],
                    $maxDistance: dist
                }
            })
            const categories = await categorySchema.find()
            const tags = await tagSchema.find()
            res.render('blogsPage', {
                blogs: blogs,
                categories: categories,
                tags: tags
            })
        }

    }
}

module.exports = reqController