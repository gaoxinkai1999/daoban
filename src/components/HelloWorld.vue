<template>
  <div class="hello"  >
    <van-calendar
        title="倒班日历"
        :poppable="false"
        :show-confirm="false"
        :style="{ height: '500px' }"
        :formatter="formatter"
    />
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
 data(){
   return{
     num:1
   }
 },
  methods: {
    formatter(day) {
      // const month = day.date.getMonth() + 1;
      // var s = day.date.toLocaleDateString();
      // var TimeStamp = this.toTimeStamp(s);
      // var distanceDays = this.getDistanceDays("2023-08-27",day.date.toLocaleDateString());
      // day.topInfo =distanceDays
      var 天数差 = this.getDistanceDays("2023-8-27",day.date.toLocaleDateString());
      var a=天数差%3
      var b=天数差%18
      // 一采
      // 二采
      // 三采
      // 一休
      // 二休
      // 三休



      if (a === 1) {
          day.topInfo = '夜';
        } else if (a === 2) {
          day.topInfo = '休';
        } else if (a === 0) {
          day.topInfo = '白';
        }
      if (b===0 ){
        day.bottomInfo = '三休'
      }else if (b===3 ){
        day.bottomInfo = '一采'
      }else if (b===6 ){
        day.bottomInfo = '二采'
      }else if (b===9 ){
        day.bottomInfo = '三采'
      }else if (b===12 ){
        day.bottomInfo = '一休'
      }else if (b===15 ){
        day.bottomInfo = '二休'
      }
      if (b===1 ){
        day.bottomInfo = '11点睡'
      }else if (b===4 ){
        day.bottomInfo = '11点睡'
      }else if (b===7 ){
        day.bottomInfo = '2点睡'
      }else if (b===10 ){
        day.bottomInfo = '9点睡'
      }else if (b===13 ){
        day.bottomInfo = '9点睡'
      }else if (b===16 ){
        day.bottomInfo = '2点睡'
      }

      //
      // if (day.type === 'start') {
      //   day.bottomInfo = '入住';
      // } else if (day.type === 'end') {
      //   day.bottomInfo = '离店';
      // }

      return day;
    },
    // 指定时间转换为时间戳
    toTimeStamp(dateString) {
      // dateString例如:'2022-03-05'
      // 例如返回:1646611200000
      return new Date(dateString) - 0
    },
    // 计算两个日期距离的天数
    getDistanceDays(date1, date2) {
      // date1例如:'2022-03-05',date2例如:'2022-03-06'
      const date1_timeStamp = this.toTimeStamp(date1)
      const date2_timeStamp = this.toTimeStamp(date2)
      let max = '', min = ''
      if (date1_timeStamp > date2_timeStamp) {
        max = date1_timeStamp
        min = date2_timeStamp
      } else {
        max = date2_timeStamp
        min = date1_timeStamp
      }
      // 例如返回:'1'
      return (max - min) / (24 * 60 * 60 * 1000)
    }


  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
