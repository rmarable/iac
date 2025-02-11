const _ = require('lodash');
const Dyno = require('dyno');

let updated = 0;

const renameGamToLinear = (settings) => {
  settings.regressionType = 'linear';
  settings.regressionTypeSettings.linear = _.cloneDeep(settings.regressionTypeSettings.gam);
  delete settings.regressionTypeSettings.gam;
}

module.exports = (record, dyno, callback) => { 
  if (!process.env.K8S_ENV) {
    throw new Error('Environment (staging/production) must be specified.');
  }

  if (!record.processingConfig || !record.processingConfig.numGenesVsNumUmis) {
    console.log(`Skipping ${record.experimentId}, it is VERY MALFORMED`);
    return callback();
  }

  console.log(`Migrating experiment ${record.experimentId}`);

  try {
    const { 
      api_url: garbageapi_url = null, 
      auth_JWT: garbageAuthJWT = null,  
      auto: garbageAuto = null, 
      filterSettings: garbageFilterSettings = null, 
      enabled = null, 
      ...samplesFilterSettings 
    } = record.processingConfig.numGenesVsNumUmis;
  
    let alreadyMigrated = false;

    Object.keys(samplesFilterSettings).forEach((sampleId) => {
      const { filterSettings = null, defaultFilterSettings = null } = samplesFilterSettings[sampleId];
  
      if (!filterSettings || !defaultFilterSettings) {
        console.log(`Skipping ${record.experimentId} sample called ${sampleId}, it is MALFORMED`);
      } else {
        // Don't run over experiments that already migrated
        if (filterSettings.regressionTypeSettings.linear) {
          console.log(`Skipping ${record.experimentId} sample called ${sampleId}, seems ALREADY MIGRATED`);
          alreadyMigrated = true;
          return;
        }
          
        renameGamToLinear(filterSettings);
        renameGamToLinear(defaultFilterSettings);
        
        const calculatedPLevel = defaultFilterSettings.regressionTypeSettings.linear['p.level'];
    
        filterSettings.regressionTypeSettings.spline = { 'p.level': calculatedPLevel };
        defaultFilterSettings.regressionTypeSettings.spline = { 'p.level': calculatedPLevel };
      }
    });

    if (alreadyMigrated) {
      console.log(`Skipping ${record.experimentId} due to alreadyMigrated ${alreadyMigrated}`);
      return callback();
    }
  
    const processingConfigToSet = _.cloneDeep(record.processingConfig);
    processingConfigToSet.numGenesVsNumUmis = { ...samplesFilterSettings };
    
    if (enabled) {
      processingConfigToSet.numGenesVsNumUmis.enabled = enabled;
    }
  
    if (garbageFilterSettings) {
      processingConfigToSet.numGenesVsNumUmis.filterSettings = garbageFilterSettings;
    }
  
    if (!dyno) {
      console.log('Dry-run detected, no updates were made');
  
      return callback();
    }
  
    dyno.updateItem({
      Key: {experimentId: record.experimentId},
      UpdateExpression: 'SET processingConfig = :processingConfig',
      ExpressionAttributeValues: {
        ':processingConfig': processingConfigToSet
      }
    }, (err) => {
      if(err) {
        console.log(`${record.experimentId} failed to update`);
        throw new Error(err);
      }
      
      console.log(`Experiment ${record.experimentId} migrated successfully`);
    });
  
    updated++;
  
    callback();
  } catch (e) {
    console.log('Error while running migration:');
    console.log(e);
    callback();
  }
}

module.exports.finish = (dyno, callback) => {
  console.log(`Updated ${updated} records.`);
  callback();
}