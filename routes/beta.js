const express = require('express'),
    mailcomposer = require('mailcomposer'),
    nunjucks = require('nunjucks'),
    uuid = require('node-uuid'),
    multer = require('multer'),
    pdf = require('html-pdf'),
    async = require('async'),
    path = require('path'),
    fs = require('fs'),
    validator = require('validator')

const config = require('./../config')

let tempUploads = multer({
    dest: './temp/',
    limits: {
        fileSize: 5 * 1024 * 1024
    }
})

let router = express.Router()

router.use(function (err, req, res, next) {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send({message: `Can't upload file: ${err.message}`})
    } else {
        next()
    }
})

router.post('/addcertificate', tempUploads.single('file'), (req, res) => {
    let extension = req.file.originalname.split('.').slice(-1),
        tempPath = req.file.path,
        newFilename = req.file.filename + '.' + extension

    const uploadedPath = path.join(__root, 'uploads', 'beta', 'certificates', newFilename)
    const relativePath = path.join('uploads', 'beta', 'certificates', newFilename)
    fs.renameSync(path.join(__root, tempPath), uploadedPath)
    res.send({ok: true, file: relativePath})
})

router.post('/adddownload', tempUploads.single('file'), (req, res) => {
    let extension = req.file.originalname.split('.').slice(-1),
        tempPath = req.file.path,
        newFilename = req.file.filename + '.' + extension
    const uploadedPath = path.join(__root, 'uploads', 'beta', 'downloads', newFilename)
    const relativePath = path.join('uploads', 'beta', 'downloads', newFilename)
    fs.renameSync(path.join(__root, tempPath), uploadedPath)
    res.send({ok: true, file: relativePath})
})

router.post('/upgrade', (req, res) => {
    async.waterfall([
        (next) => {
            if (!req.headers.authorization) {
                next({message: 'Invalid token'})
            } else {
                req.access_token = req.headers.authorization.split(' ')[1]
                models.Token.getUserByToken(req.access_token, next)
            }
        },
        (user, next) => {
            let {form} = req.body
            console.log('fomemememe',req.body)
            let certificates = form.certificates.map(cert => {
                let file = ''
                if (cert.file) {
                    file = `${req.protocol}://${req.headers.host}/${cert.file}`
                }
                return {title: cert.title, file}
            })
            let additional = form.additional.map(item => {
                let file = ''
                if (item.file) {
                    file = `${req.protocol}://${req.headers.host}/${item.file}`
                }
                return {title: item.title, file}
            })
            form.certificates = certificates
            form.additional = additional
            form.exp = form.experience.map(e => {
                return {
                    from: fmtDate(e.from),
                    to: fmtDate(e.to),
                    place: e.place,
                }
            })
            let htmlContent = nunjucks.render(__dirname + '/../templates/signupBeta.html', {form})
            const pdfName = uuid.v4() + '.pdf';
            console.log('form',form);    
            for (i in form.book){
                var a={};
                a.title=form.book[i].title;
                a.author=form.book[i].author;
                a.publication=form.book[i].publication;
                a.retailstore=form.book[i].retailstore;
                console.log('aaa',a); 
            }     

            let data = {
                author:form.author,
                ywab:form.ywab,
                yob:form.yob,
                cibw:form.cibw,
                cerci:form.cerci,
                educa:form.educa,
                expc:form.expc,
                own:form.own,
                car:form.car,
                achi:form.achi,
                consi:form.consi,
                cy:form.cy,
                expy:form.expy,
                wb:form.wb,
                hp:form.hp,
                vl:form.vl,
                pyh:form.pyh,
                name: form.name,
                intro: form.info,
                email: form.email,
                phone: form.phone,
                position: form.title,
                company: form.company,
                title: form.title,
                categories: form.categories,
                book:form.book,
                contact: {
                    email: form.email,
                    phone: form.phone,
                    linkedin: form.linkedin,
                    fb: form.facebook,
                },
                certificates: form.certificates.filter(c => !!(c.title && c.file)).map(c => {
                    return {
                        filename: c.title,
                        filepath: c.file
                    }
                }),
                certificatesB: form.certificatesB.filter(c => !!(c.title && c.file)).map(c => {
                    return {
                        filename: c.title,
                        filepath: c.file
                    }
                }),
                certificatesCa: form.certificatesCa.filter(c => !!(c.title && c.file)).map(c => {
                    return {
                        filename: c.title,
                        filepath: c.file
                    }
                }),
                certificatesE: form.certificatesE.filter(c => !!(c.title && c.file)).map(c => {
                    return {
                        filename: c.title,
                        filepath: c.file
                    }
                }),
                certificatesAc: form.certificatesAc.filter(c => !!(c.title && c.file)).map(c => {
                    return {
                        filename: c.title,
                        filepath: c.file
                    }
                }),
                certificatesC: form.certificatesC.filter(c => !!(c.title && c.file)).map(c => {
                    return {
                        filename: c.title,
                        filepath: c.file
                    }
                }),
                downloads: form.additional.filter(c => !!(c.title && c.file)).map(c => {
                    return {
                        filename: c.title,
                        filepath: c.file
                    }
                }),
                experience: form.experience.map(e => {
                    return {
                        time: `${fmtDate(e.from)} - ${fmtDate(e.to)}`,
                        place: e.place,
                    }
                })
            }
            models.User.update(user._id, data, (err, user) => {
                pdf.create(htmlContent, {format: 'Letter'}).toFile('./assets/pdf/' + pdfName, (err, resultPDF) => {

                    if (err){console.log('PDF create',err); return next(err);}
                    resultPDF.name = pdfName;
                    next(null, user, resultPDF, form, data)
                })
            })
        },
        (user, resultPDF, form,request, next) => {
            // let approveLink = `${req.protocol}://${req.headers.host}/user/upgrade?id=${user.id}&role=${form.role}`
            // console.log(approveLink);
            // var mail = mailcomposer({
            //     from: `service@${config.MAILGUN.SANDBOX_DOMAIN}`,
            //     to: config.ADMIN_EMAILS.join(', '),
            //     subject: `ER: Upgrade to ${form.role}`,
            //     text: `Upgrade for ${form.name} to ${form.role}
            //         \nApprove ${approveLink}`,
            //     html: `<strong>Upgrade for ${form.name} to ${form.role}</strong><br>
            //         <a href="${approveLink}">Approve</a>`,
            //     attachments: [{path: resultPDF.filename}]
            // })
            var requ = {
                name: user.name,
                user: user._id.toString(),
                email: user.email,
                pdf: resultPDF.name
            };
            
            models.Upgraderequests.create(requ,(err, reuq) => {
                console.log('reuq ',reuq);
                if (err) return next(err)
                next(null)    
            })
        },
        // (mail, next) => {
        //     mail.build(next)
        // }
        // (msg, next) => {
        //     mailgun.sendRaw(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, config.ADMIN_EMAILS, msg.toString('ascii'), next)
        // }
    ], (err) => {
        if (err) res.status(400).send(err)
        else res.send({ok: true})
    })
})

router.post('/signup', (req, res) => {
    let {form} = req.body
    let certificates = form.certificates.map(cert => {
        let file = ''
        if (cert.file) {
            file = `${req.protocol}://${req.headers.host}/${cert.file}`
        }
        return {title: cert.title, file}
    })

    let certificatesB = form.certificatesB.map(cert => {
        let file = ''
        if (cert.file) {
            file = `${req.protocol}://${req.headers.host}/${cert.file}`
        }
        return {title: cert.title, file}
    })
    let certificatesCa = form.certificatesCa.map(cert => {
        let file = ''
        if (cert.file) {
            file = `${req.protocol}://${req.headers.host}/${cert.file}`
        }
        return {title: cert.title, file}
    })
    let certificatesE = form.certificatesE.map(cert => {
        let file = ''
        if (cert.file) {
            file = `${req.protocol}://${req.headers.host}/${cert.file}`
        }
        return {title: cert.title, file}
    })
    let certificatesAc = form.certificatesAc.map(cert => {
        let file = ''
        if (cert.file) {
            file = `${req.protocol}://${req.headers.host}/${cert.file}`
        }
        return {title: cert.title, file}
    })
    let certificatesC = form.certificatesC.map(cert => {
        let file = ''
        if (cert.file) {
            file = `${req.protocol}://${req.headers.host}/${cert.file}`
        }
        return {title: cert.title, file}
    })
    let additional = form.additional.map(item => {
        let file = ''
        if (item.file) {
            file = `${req.protocol}://${req.headers.host}/${item.file}`
        }
        return {title: item.title, file}
    })
    form.certificates = certificates
    form.certificatesB = certificatesB
    form.certificatesCa = certificatesCa
    form.certificatesE = certificatesE
    form.certificatesAc = certificatesAc
    form.certificatesC = certificatesC
    form.additional = additional
    form.exp = form.experience.map(e => {
        return {
            from: fmtDate(e.from),
            to: fmtDate(e.to),
            place: e.place,
        }
    })
    let htmlContent = nunjucks.render(__dirname + '/../templates/signupBeta.html', {form})
    const pdfName = uuid.v4() + '.pdf';

    // Turn form to model scheme
    let user = {
        name: form.name,
        intro: form.info,
        email: form.email,
        phone: form.phone,
        position: form.title,
        company: form.company,
        role: form.role,
        title: form.title,
        contact: {
            email: form.email,
            phone: form.phone,
            linkedin: form.linkedin,
            fb: form.facebook,
        },
        certificates: form.certificates.map(c => {
            return {
                filename: c.title,
                filepath: c.file
            }
        }),
        certificatesB: form.certificatesB.map(c => {
            return {
                filename: c.title,
                filepath: c.file
            }
        }),
        certificatesCa: form.certificatesCa.map(c => {
            return {
                filename: c.title,
                filepath: c.file
            }
        }),
        certificatesE: form.certificatesE.map(c => {
            return {
                filename: c.title,
                filepath: c.file
            }
        }),
        certificatesAc: form.certificatesAc.map(c => {
            return {
                filename: c.title,
                filepath: c.file
            }
        }),
        certificatesC: form.certificatesC.map(c => {
            return {
                filename: c.title,
                filepath: c.file
            }
        }),
        downloads: form.additional.map(c => {
            return {
                filename: c.title,
                filepath: c.file
            }
        }),
        experience: form.experience.map(e => {
            return {
                time: `${fmtDate(e.from)} - ${fmtDate(e.to)}`,
                place: e.place,
            }
        })
    }

    async.waterfall([
        (next) => {
            if (!validator.isEmail(form.email)) next({message: 'Invalid email'})
            else next()
        },
        (next) => {
            models.User.findByEmail(form.email, (err, user) => {
                if (user) next({message: 'User with this email aready exist'})
                else next()
            })
        },
        (next) => {
            models.User.findByPhone(form.phone, (err, user) => {
                if (user) next({message: 'User with this phone aready exist'})
                else next()
            })
        },
        (next) => {
            models.User.createUser(user, (err, user) => {
                next(err, user)
            })
        },
        (user, next) => {
            pdf.create(htmlContent, {format: 'Letter'}).toFile('./temp/' + pdfName, (err, resultPDF) => {
                if (err) return next(err);
                next(null, user, resultPDF)
            })
        },
        (user, resultPDF, next) => {
            let approveLink = `${req.protocol}://${req.headers.host}/user/approve?id=${user.id}`,
                declineLink = `${req.protocol}://${req.headers.host}/user/decline?id=${user.id}`


            var mail = mailcomposer({
                from: `service@${config.MAILGUN.SANDBOX_DOMAIN}`,
                to: config.ADMIN_EMAILS.join(', '),
                subject: `ER: New signup for beta request`,
                text: `New signup request from ${form.name} ${form.email}
                \nApprove ${approveLink}
                \nDecline ${declineLink}`,
                html: `<strong>New signup request from ${form.name} ${form.email}</strong><br>
                <a href="${approveLink}">Approve</a><br>
                <a href="${declineLink}">Decline</a>`,
                attachments: [{path: resultPDF.filename}]
            })

            next(null, mail)
        },
        (mail, next) => {
            mail.build(next)
        },
        (msg, next) => {
            mailgun.sendRaw(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, config.ADMIN_EMAILS, msg.toString('ascii'), next)
        }
    ], (err) => {
        if (err) res.status(400).send(err)
        else res.json({ok: true})
    })
})

var fmtDate = function (d) {
    if (!d) return '';
    if (typeof d == 'string') d = new Date(d);
    var month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('/');
}

module.exports = router
