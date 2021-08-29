import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import * as moment from 'moment-timezone'
import * as fcsv from 'fast-csv';
import * as csv from 'async-csv'
import * as fs from 'fs'
import { join } from 'path';
import { orderReccentFiles } from './utils';
require('dotenv').config()

interface SpaceRawData{
  launcherId: string
  coinId:string
  headerHash: string
  confirmationBlock: number
  feeInXCH: number
  payoutBalanceInXCH:number
  payoutDate: string
  payoutPuzzleHash: string
  status: string
}
interface SpaceCSV{
  payoutDate:string,
  // payoutDateHK:string,
  status:string
  coinId:string
  confirmationBlock:number
  payoutBalanceInXCH:number
}

@Injectable()
export class AppService {

  private readonly logger = new Logger(AppService.name);
  private readonly shareDir = join(__dirname, '..', 'public')
  
  convertTime(originalTime:string){
    const r = originalTime.split(" ")
    const date = new Date(r[0] + " " + r[1].slice(2))
  
    const tempTime = moment.tz(date,"Asia/Taipei").add(-8,'hours')
    if(originalTime.includes("下午")){
      tempTime.add(12,'hours')
    }
    return tempTime.format()
  }
  
  
  // async convertOldCsv() {
  //   let dataFromOldSpace:SpaceCSV[] = []
  //   const csvString = await fs.readFileSync('oldspace.csv', 'utf-8')
  //   const rows:[] = await csv.parse(csvString)
  //   rows.shift()
  //   // console.log("rows", rows)
  //   rows.map(e=>{
  //     dataFromOldSpace.push({
  //       payoutDate:this.convertTime(e[0]),
  //       // payoutDateHK:string,
  //       status:e[1],
  //       coinId:e[2],
  //       confirmationBlock:e[3],
  //       payoutBalanceInXCH:e[4],
  //     })
  //   })
  //   console.log("dataFromOldSpace", dataFromOldSpace)
  //   const ws = fs.createWriteStream("out.csv")
  //   fcsv
  //   .write(dataFromOldSpace, { headers: true })
  //   .pipe(ws);
  
  //   console.log("end")
  // }
  
  async getOldSpaceRecord() {
    let dataFromOldSpace:SpaceCSV[] = []
    const files = orderReccentFiles(this.shareDir)
    if(!files.length){
      return dataFromOldSpace
    }
    
    const csvString = await fs.readFileSync(join(this.shareDir,files[0].file), 'utf-8')
    const rows:[] = await csv.parse(csvString,{header:true})
    rows.shift()
    rows.map(e=>{
      dataFromOldSpace.push({
        payoutDate:e[0],
        status:e[1],
        coinId:e[2],
        confirmationBlock:e[3],
        payoutBalanceInXCH:e[4],
      })
    })
  
    return dataFromOldSpace
  }
  
  async getSpaceRecord() {
    const result = await axios.get(process.env.SPACE_URL)
    // console.log("result", result.data.results)
    const spaceRawData = result.data.results as SpaceRawData[]
    const dataToWrite:SpaceCSV[] = spaceRawData.map(e=>{
      return{
        payoutDate: moment.utc(e.payoutDate).tz("Asia/Taipei").format(),
        status:e.status,
        coinId:e.coinId,
        confirmationBlock:e.confirmationBlock,
        payoutBalanceInXCH:e.payoutBalanceInXCH,
      }
    })
    return dataToWrite
  }

  async removeOldRecords(){
    const currentTime = (new Date()).getTime()
    const shareDir = join(__dirname, '..', 'public')
    const files = orderReccentFiles(shareDir,true);
    
    for(let i = 0; i < files.length; i++){
      let tempFileTime = files[i].mtime.getTime()
      let timeDiff = currentTime - tempFileTime
      console.log("timeDiff", timeDiff)
      // console.log(files[i].mtime.getTime())
      if(timeDiff > 50000){
        console.log(`${currentTime}   ${tempFileTime}   ${timeDiff}`)
      }
    }
  }

  @Cron('* * */12 * * *')
  async handleCron() {

    try {
      const currentTime = moment.tz("Asia/Taipei").format('YYYY_MM_DD_mm_ss')
      this.logger.debug(`Start ${currentTime} job`);

      let oldRecords = await this.getOldSpaceRecord()
      const newRecords = await this.getSpaceRecord()
  
      // remove duplicate records------------------------------
      if(oldRecords.length > 0){
        let lastRecord = oldRecords[oldRecords.length - 1]
        newRecords.map(e=>{
          if(e.confirmationBlock > lastRecord.confirmationBlock){
            oldRecords.push(e)
          }
        })
      }else{
        oldRecords = newRecords
      }
 
      //---------------------------------------------------------

      
      const ws = fs.createWriteStream(join(this.shareDir,`space_${currentTime}.csv`))

      fcsv
      .write(oldRecords, { headers: true })
      .pipe(ws);
  
      this.logger.debug(`Finish ${currentTime} job`);
  
  
    } catch (error) {
      console.error("error", error)
    }
    
  }
}
