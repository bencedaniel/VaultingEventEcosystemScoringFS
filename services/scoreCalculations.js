export function calculateScore(inputDatas, category) {
  const horse = horseCalc(inputDatas, category);
  const indComp = indCompcalc(inputDatas);
  const artistic = artisticScore(inputDatas, category);
  const squadPddComp = calcSquadPddComp(inputDatas, category);
  const techArtistic = techArtisticScore(inputDatas, category);
  const tech = techCalc(inputDatas, category);
  const techtestTech = techtestTechCalc(inputDatas, category);
  if (horse !== undefined && horse !== null && !isNaN(horse)) return horse;
  if (indComp !== undefined && indComp !== null && !isNaN(indComp)) return indComp;
  if (squadPddComp !== undefined && squadPddComp !== null && !isNaN(squadPddComp)) return squadPddComp;
  if (artistic !== undefined && artistic !== null && !isNaN(artistic)) return artistic;
  if (techArtistic !== undefined && techArtistic !== null && !isNaN(techArtistic)) return techArtistic;
  if (tech !== undefined && tech !== null && !isNaN(tech)) return tech;
  if (techtestTech !== undefined && techtestTech !== null && !isNaN(techtestTech)) return techtestTech;
  return excelRound(0, 3);
}



function horseCalc(inputDatas, category) { 
 const  neededFields = [
  'WandO',
  'bint',
  'BinC',
  'lunging',
  'rythm',
  'relaxation',
  'connection',
  'impulsion',
  'straightness',
  'collection',
  'a2ded1',
  'a2ded2',
  'a2ded3',
  'a2ded4',
  'a2ded5',
  'a3ded1',
  'a3ded2',
  'a3ded3',
  'a3ded4',
  'a3ded5'
]
let fieldNumbers = 0
  inputDatas.forEach(input => {
    if(neededFields.includes(input.id)) {
      fieldNumbers++;
    }
  });
  if(fieldNumbers >= neededFields.length ){
    return excelRound(calcA1(inputDatas, category) + calcA2(inputDatas, category) + calcA3(inputDatas, category), 3);
  }
}



function calcA1(inputDatas, category) {
    // Horse score A1 logic
  const rythm = dataLookup('rythm', inputDatas)
  const relaxation = dataLookup('relaxation', inputDatas)
  const connection = dataLookup('connection', inputDatas)
  const impulsion = dataLookup('impulsion', inputDatas)
  const straightness = dataLookup('straightness', inputDatas)
  const collection = dataLookup('collection', inputDatas)
  const a1percentage = category.Horse?.A1
        const sum = [rythm, relaxation, connection, impulsion, straightness, collection].reduce((acc, curr) => {
            const val = parseLocaleNumber(curr);
            return acc + (isNaN(val) ? 0 : val);

        }, 0)/6;
        
        const total = (sum * a1percentage);
        return total;

    
}

function calcA2(inputDatas, category) {
    // Horse score A2 logic
    const wando = dataLookup('WandO', inputDatas)
    const bint = dataLookup('bint', inputDatas)
    const binc = dataLookup('BinC', inputDatas)
    const a2ded1 = dataLookup('a2ded1', inputDatas)
    const a2ded2 = dataLookup('a2ded2', inputDatas)
    const a2ded3 = dataLookup('a2ded3', inputDatas)
    const a2ded4 = dataLookup('a2ded4', inputDatas)
    const a2ded5 = dataLookup('a2ded5', inputDatas)
    const a2percentage = category.Horse?.A2
    let a2dsumval =0,a2sumval=0;

      const sumOfDeductions = [a2ded1, a2ded2, a2ded3, a2ded4, a2ded5].reduce((acc, curr) => {
        const val = parseLocaleNumber(curr);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      a2dsumval = sumOfDeductions;
      
    
      const Corrwando = parseLocaleNumber(wando)*0.5
      const Corrbint = parseLocaleNumber(binc)*0.25
      const Corrbinc = parseLocaleNumber(bint)*0.25
      const sumOfa2 = [Corrwando, Corrbint, Corrbinc].reduce((acc, curr) => {
        return acc + (isNaN(curr) ? 0 : curr);
      }, 0);      
      a2sumval = nullLimit(sumOfa2)

    


      const A2 = nullLimit((a2sumval - a2dsumval))*a2percentage
      return A2;


    

}

function calcA3(inputDatas, category) {
    // Horse score A3 logic
    const lunging = dataLookup('lunging', inputDatas)
    const a3ded1 = dataLookup('a3ded1', inputDatas)
    const a3ded2 = dataLookup('a3ded2', inputDatas)
    const a3ded3 = dataLookup('a3ded3', inputDatas)
    const a3ded4 = dataLookup('a3ded4', inputDatas)
    const a3ded5 = dataLookup('a3ded5', inputDatas)
    const a3percentage = category.Horse?.A3
    let a3dsumval =0,a3sumval=0;

      const sumOfDeductions = [a3ded1, a3ded2, a3ded3, a3ded4, a3ded5].reduce((acc, curr) => {
        const val = parseLocaleNumber(curr);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      a3dsumval = sumOfDeductions;
      
    

      a3sumval = parseLocaleNumber(lunging) || 0;
    

      const A3 = nullLimit((a3sumval - a3dsumval))*a3percentage
      return A3;


      
}





function parseLocaleNumber(value) {
  if (typeof value !== 'string') return NaN;
  return parseFloat(value.replace(',', '.'));
}

function excelRound(value, decimals = 1) {
  const multiplier = Math.pow(10, decimals);
  return (Math.round((value * multiplier) + Number.EPSILON) / multiplier).toFixed(decimals);
}

function nullLimit(value){
  if( value <= 0){
    return 0.000
  }else{
    return value
  }
}
function tenLimit(value){
  if( value >= 10){
    return 10.000
  }else{
    return value
  }
}

function dataLookup(id, inputDatas) {
  const input = inputDatas.find(input => input.id === id);
  if (input) {
    return input.value;
  }
  return '';
}




function indCompcalc(inputDatas){
  const compfields = ['vault-on', 'flag','mill', 'scrissors-forward', 'scrissors-backward','stand','flank1st','swingoff','basic-seat','swingforward', 'halfMill','swingBack','flank']
  let indcomp = 0;
  let NoOfComp = 0;
  compfields.forEach(element => {
      const dataelement = dataLookup(element, inputDatas);
      if(dataelement !== undefined && dataelement !== null && dataelement !== ''){
          NoOfComp += 1;
          const val = parseLocaleNumber(dataelement);
          if(!isNaN(val)){
              
              indcomp += val;
          }


          
      }
  });
  if(NoOfComp > 0){
      const average = indcomp / NoOfComp;
      return excelRound(nullLimit(average),3);
}
}

function calcSquadPddComp(inputDatas,category){
  if (category.Type === 'Squad' || (category.Type === 'PDD')) {
    const inputs = inputDatas;
    let vaultOn = 0, flag = 0, mill = 0, scissF = 0, scissB = 0, stand = 0, flank = 0, swingOff = 0, basicSeat = 0, swingF = 0, halfM = 0, swingB = 0;
    
    const fieldMappings = {
        'vaultOn': { variable: () => vaultOn, setter: (v) => vaultOn = v},
        'flag': { variable: () => flag, setter: (v) => flag = v},
        'mill': { variable: () => mill, setter: (v) => mill = v},
        'scissF': { variable: () => scissF, setter: (v) => scissF = v},
        'scissB': { variable: () => scissB, setter: (v) => scissB = v},
        'stand': { variable: () => stand, setter: (v) => stand = v},
        'flank': { variable: () => flank, setter: (v) => flank = v},
        'swingOff': { variable: () => swingOff, setter: (v) => swingOff = v},
        'basicSeat': { variable: () => basicSeat, setter: (v) => basicSeat = v},
        'swingF': { variable: () => swingF, setter: (v) => swingF = v},
        'halfM': { variable: () => halfM, setter: (v) => halfM = v},
        'swingB': { variable: () => swingB, setter: (v) => swingB = v},
    };
    let numberOfFields = 0;
    
    
    inputs.forEach(element => {
        const id = element.id;
        for (const [fieldName, config] of Object.entries(fieldMappings)) {
            if (id.includes(fieldName)) {
                numberOfFields++;
                const val = parseLocaleNumber(element.value);
                if (!isNaN(val)) {
                    config.setter(config.variable() + val);

                }
                
                break;
            }
        }
    });
    let numberOfVaulters, numberOfExercises;
    if(category.Type === 'Squad'){
    numberOfVaulters = 6;
    numberOfExercises = numberOfFields / numberOfVaulters ;
    }else{
    numberOfVaulters = 2;
    numberOfExercises = numberOfFields / numberOfVaulters ;
    }

    
    const total = vaultOn + flag + mill + scissF + scissB + stand + flank + swingOff + basicSeat + swingF + halfM + swingB;
    const result = excelRound(nullLimit((total/numberOfVaulters)/numberOfExercises),3);
    
    if(result !== NaN){
    return result;
    }

  }
}



function artisticScore(inputDatas,category){
  const cohInput = dataLookup('coh', inputDatas);
  const artisticCH = category.Artistic?.CH;
  const artisticC1 = category.Artistic?.C1;
  const artisticC2 = category.Artistic?.C2;
  const artisticC3 = category.Artistic?.C3;
  const artisticC4 = category.Artistic?.C4;
  let CH = 0, C1 = 0, C2 = 0, C3 = 0, C4 = 0;
  if(cohInput !== undefined || cohInput !== null || cohInput !== ''){
    const val = cohInput
    if(!isNaN(parseLocaleNumber(val))){
    CH = nullLimit(parseLocaleNumber(val))*artisticCH;
    }
    else{
      CH = 0;
    }
    

  };

  const c1Input = dataLookup('c1', inputDatas);
  if(c1Input !== undefined || c1Input !== null || c1Input !== ''){
    const val = c1Input
    if(!isNaN(parseLocaleNumber(val))){
    C1 = nullLimit(parseLocaleNumber(val))*artisticC1;
    }
    else{
      C1 = 0;

    }

    

  };

  const c2Input = dataLookup('c2', inputDatas);
  if(c2Input !== undefined || c2Input !== null || c2Input !== ''){
    const val = c2Input
    if(!isNaN(parseLocaleNumber(val))){
    C2 = nullLimit(parseLocaleNumber(val))*artisticC2;
    }
    else{
      C2 = 0;
    }

    

  };
    const c3Input = dataLookup('c3', inputDatas);
  if(c3Input !== undefined || c3Input !== null || c3Input !== ''){
    const val = c3Input
    if(!isNaN(parseLocaleNumber(val))){
    C3 = nullLimit(parseLocaleNumber(val))*artisticC3;
    }
    else{
      C3 = 0;
    }


    

  };
  const c4Input = dataLookup('c4', inputDatas);
  if(c4Input !== undefined || c4Input !== null || c4Input !== ''){
    
    const val = c4Input
    if(!isNaN(parseLocaleNumber(val))){
    C4 = nullLimit(parseLocaleNumber(val))*artisticC4;
    }
    else{
      C4 = 0;
    }


    

  };

  if(c1Input !== NaN && c2Input !== NaN && c3Input !== NaN && c4Input !== NaN && cohInput !== NaN  
    && cohInput !== undefined && cohInput !== null && cohInput !== '' && c1Input !== undefined 
    && c1Input !== null && c1Input !== '' && c2Input !== undefined && c2Input !== null && c2Input !== '' 
    && c3Input !== undefined && c3Input !== null && c3Input !== '' && c4Input !== undefined && c4Input !== null && c4Input !== ''){
  const deduction = dataLookup('deduction', inputDatas);
  const deductionVal = parseLocaleNumber(deduction) || 0;
  const total = nullLimit((CH + C1 + C2 + C3 + C4) - deductionVal);
  return excelRound(total,3);
  
};


}


function techArtisticScore(inputDatas,category){
  const artistictechCH = category.TechArtistic?.CH;
  const artisticT1 = category.TechArtistic?.T1;
  const artisticT2 = category.TechArtistic?.T2;
  const artisticT3 = category.TechArtistic?.T3;

  const tcohInput = dataLookup('tcoh', inputDatas);
  let TCH = 0, T1 = 0, T2 = 0, T3 = 0;
  if(tcohInput){
    const val = tcohInput
    if(!isNaN(parseLocaleNumber(val))){
    TCH = nullLimit(parseLocaleNumber(val))*artistictechCH;
    }
    else{
      TCH = 0;
    }
    

  };

  const t1Input = dataLookup('t1', inputDatas);
  if(t1Input){
    const val = t1Input
    if(!isNaN(parseLocaleNumber(val))){
    T1 = nullLimit(parseLocaleNumber(val))*artisticT1;
    }
    else{
      T1 = 0;

    }

  };

  const t2Input = dataLookup('t2', inputDatas);
  if(t2Input){
    const val = t2Input
    if(!isNaN(parseLocaleNumber(val))){
    T2 = nullLimit(parseLocaleNumber(val))*artisticT2;
    }
    else{
      T2 = 0;
    }    

  };
  

    const t3Input = dataLookup('t3', inputDatas);
  if(t3Input){
    const val = t3Input
    if(!isNaN(parseLocaleNumber(val))){
    T3 = nullLimit(parseLocaleNumber(val))*artisticT3;
    }
    else{
      T3 = 0;
    }    

  };
  
if(t1Input !== '' && t2Input !== '' && t3Input !== '' && tcohInput !== ''){
  const deduction = dataLookup('deduction', inputDatas);
  const deductionVal = parseLocaleNumber(deduction) || 0;
  const total = nullLimit((TCH + T1 + T2 + T3) - deductionVal);
  return excelRound(total,3);
}


}



function techCalc(inputDatas,category){

  const Rmultipler = category.Free?.R || 0;
  const Dmultipler = category.Free?.D || 0;
  const Mmultipler = category.Free?.M || 0;
  const Emultipler = category.Free?.E || 0;
  const NumberOfMaxExercises = category.Free?.NumberOfMaxExercises || 10;
  let pointbyElementsinv = 0;
  const records = dataLookup('records', inputDatas);
  if(records !== undefined && records !== null && records !== ''){
   let R =0, D =0, M = 0, E=0, sumOfDeductions =0, sumOfFalls=0;
    const value = records.split(' ');
    const valuewithoutFalls = [];
    const falls = [];
    value.forEach(element => {
        if(element.toLowerCase().includes('f')){
          falls.push(element);
          
        }
        else{
          valuewithoutFalls.push(element);
        }
    });



   const chars = records.split('');
   chars.forEach((char) => {

    if (char == 'R' || char == 'r' ) {
      R++;
    } else if (char == 'D' || char == 'd' ) {
      D++;
    } 
    else if (char == 'M' || char == 'm' ) {
      M++;
    } 
    else if (char == 'E' || char == 'e' ) {
      E++;
    }

    
    
   });
   let sumOfExercOneStar = 0;

  const deduction = valuewithoutFalls.join(' ').replace(/[^0-9 ]/g, '').split(' ');
    deduction.forEach((numStr) => {
      const num = parseInt(numStr);
      if (!isNaN(num)) {
        
        if (num > 0 && num <= 10) {
          sumOfExercOneStar += 1;
          sumOfDeductions += num;
        }
        else {
          ShowErrorToast('Invalid deduction number: ' + numStr);
        }
      }

    });


  const deductionFalls = falls.join(' ').replace(/[^0-9 ]/g, '').split(' ');
    deductionFalls.forEach((numStr) => {
      const num = parseInt(numStr);
      if (!isNaN(num)) {
        
        if (num > 0 && num <= 50) {
          sumOfFalls += num;
        }
        else {
          ShowErrorToast('Invalid fall deduction number: ' + numStr);
        }
      }

    });
    let perfmultipler = 1;
    let diffmultipler = 1;
    let sumOfExercises =0;
    if((R + D + M + E) ==0){
      if( deduction[0] !== ''){
        perfmultipler = 1
        diffmultipler = 0
        sumOfExercises = sumOfExercOneStar;}
    }else{
      perfmultipler = 0.7
      diffmultipler = 0.3
       sumOfExercises = R + D + M + E;

    }

    let pointbyElements = 0;
    if(!isNaN(tenLimit(sumOfDeductions/sumOfExercises))){
      pointbyElements = tenLimit(sumOfDeductions/sumOfExercises);
      pointbyElementsinv = 10 - pointbyElements;

    }
    else{
      pointbyElements = 0;
      pointbyElementsinv = 0;
    }

    const PerformanceScore = nullLimit(pointbyElementsinv - (sumOfFalls/10));
    const MaxExercisesCount = NumberOfMaxExercises || 10;
    let MaxR = 0, MaxD = 0, MaxM = 0, MaxE = 0;
    let ClonedR = R, ClonedD = D, ClonedM = M, ClonedE = E;
    while(true){
        const sumCheck = MaxR + MaxD + MaxM + MaxE;
        if(sumCheck == MaxExercisesCount || (ClonedR == 0 && ClonedD == 0 && ClonedM == 0 && ClonedE == 0)){
          break;
        }
        if(ClonedR > 0){
          MaxR +=1;
          ClonedR -=1;
        } else if(ClonedD > 0){
          MaxD +=1;
          ClonedD -=1;
        } else if(ClonedM > 0){
          MaxM +=1;
          ClonedM -=1;
        } else if(ClonedE > 0){
          MaxE +=1;
          ClonedE -=1;
        }








    }

    const Rscore = MaxR * Rmultipler;
    const Dscore = MaxD * Dmultipler;
    const Mscore = MaxM * Mmultipler;
    const Escore = MaxE * Emultipler;
    const DiffTotal = tenLimit(Rscore + Dscore + Mscore + Escore);
    const total = DiffTotal *diffmultipler + PerformanceScore *perfmultipler;
    return excelRound(total,3);
  
  }
}

function techtestTechCalc(inputDatas,category){
  const techDivider = category.TechArtistic?.TechDivider || 1;

  const records = dataLookup('techrecords', inputDatas);
  if(records !== undefined && records !== null && records !== ''){
   let sumOfDeductions =0, sumOfFalls=0;
    const value = records.split(' ');
    const valuewithoutFalls = [];
    const falls = [];
    value.forEach(element => {
        if(element.toLowerCase().includes('f')){
          falls.push(element);
          
        }
        else{
          valuewithoutFalls.push(element);
        }
    });





  const deduction = valuewithoutFalls.join(' ').replace(/[^0-9 ]/g, '').split(' ');
        let sumOfExercises =0;

    deduction.forEach((numStr) => {
      const num = parseInt(numStr);
      if (!isNaN(num)) {
        
        if (num >= 0 && num <= 10) {
          sumOfExercises += 1;

          sumOfDeductions += num;
        }
        else {
          ShowErrorToast('Invalid deduction number: ' + numStr);
        }
      }

    });

  const deductionFalls = falls.join(' ').replace(/[^0-9 ]/g, '').split(' ');
    deductionFalls.forEach((numStr) => {
      const num = parseInt(numStr);
      if (!isNaN(num)) {
        
        if (num >= 0 && num <= 50) {
          sumOfFalls += num;
        }
        else {
          ShowErrorToast('Invalid fall deduction number: ' + numStr);
        }
      }

    });




    let pointbyElementsinv = 0;
    let pointbyElements = 0;
    if(!isNaN(tenLimit(sumOfDeductions/sumOfExercises))){
      pointbyElements = tenLimit(sumOfDeductions/sumOfExercises);
      pointbyElementsinv = 10 - pointbyElements;

    }
    else{
      pointbyElements = 0;
      pointbyElementsinv = 0;
    }

    const PerformanceScore = nullLimit(pointbyElementsinv - (sumOfFalls/10));
    const TechExercFields = ['standBackward','cartwheel','lowerarmstand','mountreverse', 'standsplit']
    let sum = PerformanceScore;
    TechExercFields.forEach((fieldId) => {
      const fieldElement = dataLookup(fieldId, inputDatas);
      if (fieldElement) {
        const val = parseLocaleNumber(fieldElement);
        if (!isNaN(val) && val >=0 && val <= 10) {
          sum += val;
        }
      }
    });
    const total = tenLimit(sum / techDivider);

    return excelRound(total,3);
  
  
  }


}