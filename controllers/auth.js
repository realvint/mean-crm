const bcrypt = require('bcrypt')// никогда не используйте bcryptjs
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const keys = require('../config/keys')
const errorHandler = require('../utilus/errorHandler')
module.exports.login = async function (req, res) {
 const candidate = await User.findOne({ email: req.body.email})
    if (candidate) {
        //Проверим пароль, пользователь существует
       const passwordResult = bcrypt.compareSync(req.body.password, candidate.password)
        if (passwordResult){
            //всё валидно, генерим ток
            const token = jwt.sign({
                email: candidate.email,
                userId: candidate._id
            }, keys.jwt, {expiresIn: 36000})
            res.status(200).json({
                token:`Bearer ${token}`
            })
        }else
            //ОшиПка: Пароль не пароль
            res.status(401).json({message:'Пароль не пароль'})
    } else {
        //ОшиПка: Пользователь не существует
        res.status(404).json({message:'Пользователь не найден'})
    }
}

module.exports.register = async function (req, res){
    // email password
    const candidate = await User.findOne({email: req.body.email})
    if(candidate) {
        // Пользователь существует - ошибка
        res.status(409).json({
            message: 'Такой e-mail уже занят'
        })
    } else {
        // Нужно создать пользователя
        const salt = bcrypt.genSaltSync(10)
        const password = req.body.password
        const user = new User({
        email: req.body.email,
        password: bcrypt.hashSync(password, salt)
    })
        try {
            await user.save()
            res.status(201).json(user)
        } catch (e){
        // ошиПка
        errorHandler(res, e)
        }

    }

}