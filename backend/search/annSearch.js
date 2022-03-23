async function handleRequest() {
    const requestBody = JSON.parse(context.request.body)

    if (requestBody.query == undefined || requestBody.query.length < 1) return {}

    var queryValue = undefined;
    requestBody.query.every(q => {
        if (q.value != undefined) {
            queryValue = q.value;
            return false;
        }
        return true;
    })

    if (queryValue == undefined) return {}

    const includeFields = requestBody.query[0].includeFields
    const ids = requestBody.query.map(q => q.id);

    const esBodyToPass = {
        _source: {
            includes: includeFields
        }
    }

    if (queryValue != undefined) {
        const vectoredValue = await getVectorForData(queryValue);
        esBodyToPass.knn = {
            field: "name_vector",
            query_vector: vectoredValue,
            k: 10,
            num_candidates: 3500
        }
    } else {
        esBodyToPass.query = {
            match_all: {}
        }
    }

    return {
        esPath: "/app-store-data/_knn_search",
        esBody: esBodyToPass,
        queryIds: ids
    }
}


async function getVectorForData(data) {
    const url = `${context.envs.bertURL}/encode`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: 1,
            texts: [data],
            is_tokenized: false
        })
    });

    const jsonResponse = JSON.parse(response);
    return jsonResponse.result[0];
}