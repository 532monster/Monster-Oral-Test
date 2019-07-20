// pages/game/game.js
const app = getApp()

import { evalMode, assessmentItems, } from '../../utils/conf.js'
import { language } from '../../utils/language.js'


const languageCN = language[0]

import { requestAppId, requestUrl } from '../../utils/conf.js'

import mockWord from '../../utils/mock_word_hard.js'
// const plugin = require('../../utils/api/manager.js')
const plugin = requirePlugin("ihearing-eval")

// 获取**全局唯一**的语音识别管理器**recordRecoManager**
const manager = plugin.getRecordRecognitionManager()


const overallIndex = [{
  key: 'pron_accuracy',
  desc: '准确度',
},
{
  key: 'pron_fluency',
  desc: '流畅度',
},
{
  key: 'pron_completion',
  desc: '完成度',
},
]


Page({
  data: {
    life: 100,
    mode: 'word',
    modeDetail: evalMode.word,

    assessmentItem: {},

    index: 0,
    canNext: true,
    win: false,

    // hasResult: false,

    hasResult: true,

    buttonType: 'normal',

    // 整体结果
    overallResult: {
      "pron_accuracy": 56,
      "pron_fluency": 30,
      "pron_completion": 32,
    },

    // 整体指标
    overallIndex: overallIndex,


    // 返回结果处理后的音标数组
    phoneticArr: [
    ],

    // 返回结果处理后的单词数组
    wordArr: [],

    wordError: [], // 错误单词
    wordCaton: [], // 停顿过长
    wordMiss: [], // 遗漏词汇
    wordExtra: [], // 多读词汇


    voicePath: "",

    playType: 'wait', // 语音播放状态


  },

  getWords(offset = 0) {
    let data = mockWord

    let modeName = this.data.mode
    let word_list = data.word_list
    // 数据放global
    app.globalData.currentWordList = word_list
    let wordJson = {}
    word_list.forEach(word => {
      let text = word.text
      wordJson[text] = word
    })
    app.globalData.wordInfo = Object.assign(app.globalData.wordInfo, wordJson)
    // ---
    // console.log("word_list", word_list)


  },

  streamRecord: function (e) {

    manager.start({
      content: this.data.assessmentItem.text,
      evalMode: this.data.mode,
      scoreCoeff: app.globalData.score_coeff,
      // log: "showmedetail",
    })

    wx.showLoading({
      title: '录音中',
      // mask: true,
    })


  },

  endStreamRecord: function () {
    console.log("endStreamRecord")
    manager.stop()

    wx.showLoading({
      title: '识别中',
    })


  },

  next: function () {
    if (!this.data.canNext) {
      console.warn("not can next ")
      return
    }
    this.initPage({
      mode: this.data.mode,
      index: this.data.index + 1
    })
  },





  // 处理浮点数
  handleNum: function (num) {
    return Number(num).toFixed(0)
  },

  // 准确度分级
  getAccuracyType: function (accuracy) {
    let accuracyType = 'normal'
    if (accuracy > 80) {
      accuracyType = 'success'
    } else if (accuracy < 60) {
      accuracyType = 'error'
    }
    return accuracyType
  },

  // 单词模式处理音标
  handlePhoneInfo: function (result) {
    let word = result.words[0]
    let phoneArr = word.phone_info

    let phoneHandledArr = []
    for (let i = 0; i < phoneArr.length; i++) {
      let phoneItem = phoneArr[i]

      let phoneType = this.getAccuracyType(phoneItem.pron_accuracy)

      phoneHandledArr.push({
        phone: phoneItem.phone,
        type: phoneType,
      })
    }

    this.setData({
      phoneticArr: phoneHandledArr
    })
  },


  // 缓存评估结果到localstorage
  cacheResult: function (result) {
    let content = this.data.assessmentItem.text
    let mode = this.data.mode

    let contentData = {
      content: content,
      index: this.data.index,
      pron_accuracy: this.handleNum(result.pron_accuracy),
    }

    let life = this.data.life
    life = life - contentData.pron_accuracy * 0.125
    this.setData({
      life: life
    })

  },

  // 统一处理整体评估结果
  handleOverallResult: function (result) {
    this.setData({
      overallResult: {
        pron_accuracy: this.handleNum(result.pron_accuracy),
        pron_fluency: this.handleNum(result.pron_fluency),
        pron_completion: this.handleNum(result.pron_completion),
      },
    })
  },

  // 单词模式
  buildWordResult: function (result) {
    this.handleOverallResult(result)
    this.handlePhoneInfo(result)

    this.cacheResult(result)
  },


  /**
   * 识别内容为空时的反馈
   */
  showRecordEmptyTip: function () {

    wx.showToast({
      title: languageCN.recognize_nothing,
      icon: 'success',
      image: '/images/no_voice.png',
      duration: 1000,
      success: function (res) {

      },
      fail: function (res) {
        console.log(res);
      }
    });
  },


  /**
   * 初始化语音识别回调
   * 绑定语音播放开始事件
   */
  initRecord: function () {
    // 识别结束事件
    manager.onStop = (res) => {

      console.log("out stop", res)
      let result = res.result

      if (result.words.length == 0) {
        this.showRecordEmptyTip()
        return
      }


      switch (this.data.mode) {
        case 'word':
          this.buildWordResult(result)
          break
        case 'sentence':
          this.buildSentenceResult(result)
          break
        default:
          break
      }
      this.setData({
        hasResult: true,
      })

      wx.hideLoading()
    }

    // 识别错误事件
    manager.onError = (res) => {

      console.error("out error", res)

      setTimeout(() => {
        wx.hideLoading()


        wx.showToast({
          title: res.msg,
          icon: 'none',
          duration: 2000
        })
      }, 20)


    }
  },

  initPage: function (option) {
    console.log("initPage", option)
    let index = option.index || 0
    let modeName = option.mode || 'word'
    let modeDetail = evalMode[modeName] || {}

    let listKey = 'currentWordList'
    let assessmentList = app.globalData[listKey]

    let assessmentItem = assessmentList[index] || {}
    if (modeName == 'word') {
      app.globalData.currentSentenceList = assessmentItem.sent_ids || []
    }

    let canNext = index < assessmentList.length - 1

    this.setData({
      mode: modeName,
      modeDetail: modeDetail,
      assessmentItem: assessmentItem,
      index: Number(index),
      hasResult: false,
      voicePath: '',
      canNext: canNext,
    })

    wx.setNavigationBarTitle({
      title: `游戏模式`
    })
  },

  onLoad: function (option) {
    // mode=sentence&index=10
    console.log("assessment", option)

    this.getWords()

    let modeName = 'word'
    let modeDetail = evalMode[modeName] || {}

    this.setData({
      mode: modeName,
      modeDetail: modeDetail,
    })

    this.initPage(option)

    this.initRecord()

    app.getRecordAuth()

  },

  onHide: function () {
    const innerAudioContext = wx.createInnerAudioContext()

    innerAudioContext.stop()
  },

})