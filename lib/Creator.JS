const {
    fetchRepoList,
    fetchTagList
} = require('./request.js')
const Inquirer = require('inquirer')
const ora = require('ora')
const downloadGitRepo = require('download-git-repo') // 不支持promise
const util = require('util') // node自带的方法
const path = require('path')

async function sleep(n) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, n)
    })
}
// 只做了一个等待的loading
async function wrapLoading(fn, message, ...args) {
    const spinner = ora(message)
    spinner.start() // 开启加载
    try {
        let repos = await fn(...args)
        spinner.succeed() // 成功
        return repos
    } catch (error) {
        // 失败了重新抓取
        spinner.fail('request failed, refetch ...')
        await sleep(1000)
        return wrapLoading(fn, message, ...args)
    }
}
class Creator {
    constructor(projectName, targetDir) { // new 的时候回调用构造函数
        this.name = projectName
        this.target = targetDir
        this.downloadGitRepo = util.promisify(downloadGitRepo) // 把downloadGitRepo转成promise方法
    }

    async fetchRepo() {
        let repos = await wrapLoading(fetchRepoList, 'waiting fetch template')
        if (!repos) return
        repos = repos.map((item) => item.name)
        const {
            repo
        } = await Inquirer.prompt({
            name: 'repo',
            type: 'list',
            choices: repos,
            message: 'please choose a template to create project'
        })
        console.log(repo);
        return repo
    }
    async fetchTag(repo) {
        let tags = await wrapLoading(fetchTagList, 'waitting fetch tag', repo)
        if (!tags) return
        tags = tags.map(item => item.name)
        const {
            tag
        } = await Inquirer.prompt({
            name: 'tag',
            type: 'list',
            choices: tags,
            message: 'please choose a tag to create project'
        })
        return tag
    }
    async download(repo, tag) {
        // 1、需要拼接出下载路径
        let requestUrl = `conglin-cli/${repo}${tag?'#'+tag:''}`
        // 2、把资源下载到某个路径上(后续可以增加缓存功能, 应该下载到系统目录中，稍后可以再使用ejs handlebar 去渲染模版，最后生成结果再写入)
        await this.downloadGitRepo(requestUrl, path.resolve(process.cwd(), `${repo}@${tag}`))
        return this.target
    }

    // 真实开始创建了
    // 采用远程拉取的方式 github
    async create() {
        // 1） 先去啦去当前组织下的模版
        let repo = await this.fetchRepo()
        // 2）再通过模版找到版本号
        let tag = await this.fetchTag(repo)

        //3) 下载
        await this.download(repo, tag)
    }
}

module.exports = Creator