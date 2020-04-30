const AWS = require('aws-sdk');
const config = require('../config');


class ExperimentService {
  constructor() {
    this.dynamodb = new AWS.DynamoDB({
      region: 'eu-west-2',
    });
    this.tableName = `experiments-${config.clusterEnv}`;
  }

  async getExperimentData(experimentId) {
    let key = { experiment_id: experimentId };
    key = AWS.DynamoDB.Converter.marshall(key);

    const params = {
      TableName: this.tableName,
      Key: key,
      ProjectionExpression: 'experiment_id, experiment_name',
    };

    const data = await this.dynamodb.getItem(params).promise();
    const prettyData = AWS.DynamoDB.Converter.unmarshall(data.Item);

    return prettyData;
  }

  async getCellSets(experimentId) {
    let key = { experiment_id: experimentId };
    key = AWS.DynamoDB.Converter.marshall(key);

    const params = {
      TableName: this.tableName,
      Key: key,
      ProjectionExpression: 'cell_sets',
    };

    const data = await this.dynamodb.getItem(params).promise();
    const prettyData = AWS.DynamoDB.Converter.unmarshall(data.Item);

    return prettyData;
  }

  generateMockData() {
    let mockData = {
      experiment_id: '5e959f9c9f4b120771249001',
      experiment_name: 'TGFB1 experiment',
      matrix_path: 'balbad',
      cell_sets: [
        {
          key: 1,
          name: 'Cell types',
          rootNode: true,
          children: [
            { key: 7, name: 'Hepatocytes', color: '#008DA6' },
            { key: 3, name: 'B cells', color: '#AB149E' },
            { key: 4, name: 'Kupffer cells', color: '#F44E3B' },
            {
              key: 5,
              name: 'Stellate cells and myofibroblasts',
              color: '#FCDC00',
            },
            {
              key: 6,
              name: 'Liver sinusoidal endothelial cells',
              color: '#68BC00',
            },
          ],
        },
        {
          key: 2,
          name: 'Louvain clusters',
          rootNode: true,
          children: [
            { key: 8, name: 'Cluster 1', color: '#CCCCCC' },
            { key: 9, name: 'Cluster 2', color: '#9F0500' },
            { key: 10, name: 'Cluster 3', color: '#C45100' },
          ],
        },
        { key: 15, name: 'My Custom Set', rootNode: true },
        {
          key: 11,
          name: 'k-Means clusters',
          rootNode: true,
          children: [
            { key: 12, name: 'Cluster 1', color: '#CCCCCC' },
            { key: 13, name: 'Cluster 2', color: '#9F0500' },
            { key: 14, name: 'Cluster 3', color: '#C45100' },
          ],
        },
      ],
    };
    mockData = AWS.DynamoDB.Converter.marshall(mockData);

    const params = {
      TableNamesss: this.tableName,
      Item: mockData,
    };


    return this.dynamodb.putItem(params).promise();
  }
}

module.exports = ExperimentService;
