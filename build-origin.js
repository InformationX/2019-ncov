const axios = require('axios')
const pinyin = require('pinyin')
const fs = require('fs')

const loadOverall = async data => {
  const overall = data
    .match(/window.getStatisticsService = (.*?)}catch/)[1]
  const result = JSON.parse(overall)
  const numbers = result.countRemark.match(/\d+/g)
  result.confirmed = numbers[0]
  result.suspect = numbers[1]
  result.death = numbers[2]
  result.cured = numbers[3]
  fs.writeFileSync('./src/data/overall.json', JSON.stringify(result, null, 2))
}

const loadCityList = async data => {
  const cityList = data
    .match(/window.getAreaStat = (.*?)}catch/)[1]
  const provinces = JSON.parse(cityList)
  const result = JSON.stringify(provinces.map(p => {
    if (p.provinceShortName === '陕西') {
      p.pinyin = 'shanxi1'
    }
    return {
      pinyin: pinyin(p.provinceShortName, {
        style: pinyin.STYLE_NORMAL
      }).map(x => x[0]).join(''),
      name: p.provinceShortName,
      ...p,
      cities: p.cities.map(city => {
        let fullCityName = city.cityName + '市'
        if (city.cityName.length > 2 && /(市|州|区|旗)/.test(city.cityName)) {
          fullCityName = city.cityName
        }
        return {
          ...city,
          fullCityName
        }
      })
    }
  }), null, 2)
  fs.writeFileSync('./src/data/area.json', result)
}

axios.request('https://3g.dxy.cn/newh5/view/pneumonia').then(({ data: html }) => {
  loadCityList(html);
  loadOverall(html);
})