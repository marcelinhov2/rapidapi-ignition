const neatCsv = require('neat-csv');
const fs = require('fs')
const batchPromises = require('batch-promises');
const request = require("request-promise-native");

exports.handler = async (event, context, callback) => {
	const forEachPromise = async (items, fn) => {
		return await batchPromises(event["batch-size"], items, fn)
	}

	const googleSearchApi = async (querystring) => {
		const options = {
			method: 'GET',
			url: 'https://google-search1.p.rapidapi.com/google-search',
			qs: querystring,
			headers: {
				'x-rapidapi-host': 'google-search1.p.rapidapi.com',
				'x-rapidapi-key': event["x-rapidapi-key"],
				useQueryString: true
			}
		};
	
		try {
			const result = await request(options);

			console.log('!!!!!!!!!!!!!!!!!!')
			console.log('DO SOMETHING WITH THE RESULT')
			console.log(result)
			console.log('!!!!!!!!!!!!!!!!!!')

			return result;
		} catch (e) {
			console.log('################')
			console.log('googleSearchApi retrying: ', querystring)
			console.log('################')

			return await googleSearchApi(querystring);
		}
	}
	
	const parseCsv = async () => {
		return new Promise((resolve, reject) => {
			fs.readFile('input.csv', async (err, data) => {
				if (err)
					return err
	
				const result = await neatCsv(data, {headers:false});
				return resolve(result.map(val => Object.values(val)[0]));
			})
		});
	}
	
	try {
		const result = await parseCsv();
		await forEachPromise(result, async(current) => {
			// At 'q', this current is the line at the CSV
			return await googleSearchApi({
				q: current, 
				hl: 'en', 
				gl: 'us'
			});
		})

		return callback(null, 'success');
	} catch (e) {
		return callback(e)
	}
};