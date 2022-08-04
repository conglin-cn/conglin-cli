const path = require('path')
const fs = require('fs-extra')
const Inquirer = require('inquirer');
const Creator = require('./Creator.JS');
// 里面可能有很多异步的操作，所以包装成async函数
module.exports = async function (projectName, options) {
    const cwd = process.cwd(); // 获取当前命令执行时的工作目录

    const targetDir = path.join(cwd, projectName) // 目标目录

    if (fs.existsSync(targetDir)) {
        if (options.force) { // 如果强制创建，删除已有的
            await fs.remove(targetDir)
        } else {
            // 提示用户是否确定覆盖
            let {
                action
            } = await Inquirer.prompt([{ // 配置询问的方式
                name: 'action',
                type: 'list', // 类型非常丰富、输入框、复选框等等
                message: 'Target directory already exists Pick an action',
                choices: [{ // 选项
                        name: 'Overwrite',
                        value: 'overwrite'
                    },
                    {
                        name: 'Cancel',
                        value: false
                    }
                ]
            }])
            console.log(action);
            if (!action) {
                return
            } else if (action === 'overwrite') {
                await fs.remove(targetDir)
            }
        }
    }
    // 创建项目
    const creator = new Creator(projectName, targetDir)
    creator.create() // 开始创建项目
}