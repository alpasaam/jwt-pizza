import { sleep, group, fail, check } from 'k6'
import http from 'k6/http'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Scenario_1: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 5, duration: '30s' },
        { target: 15, duration: '1m' },
        { target: 10, duration: '30s' },
        { target: 0, duration: '30s' },
      ],
      gracefulRampDown: '30s',
      exec: 'scenario_1',
    },
  },
}

export function scenario_1() {
  let response
  const vars = {}

  group('page_1 - https://pizza.saamn.dev/', function () {
    response = http.get('https://pizza.saamn.dev/', {
      headers: {
        Host: 'pizza.saamn.dev',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        Priority: 'u=0, i',
      },
    })
    sleep(24.6)

    response = http.put(
      'https://pizza-service.saamn.dev/api/auth',
      '{"email":"Saamd7test@test.com","password":"saamd7test"}',
      {
        headers: {
          Host: 'pizza-service.saamn.dev',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Content-Type': 'application/json',
          Origin: 'https://pizza.saamn.dev',
          Connection: 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          Priority: 'u=0',
        },
      }
    )

    if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Login was *not* 200');
    }
    vars.authToken = response.json().token

    response = http.options('https://pizza-service.saamn.dev/api/auth', null, {
      headers: {
        Host: 'pizza-service.saamn.dev',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'content-type',
        Origin: 'https://pizza.saamn.dev',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        Priority: 'u=4',
      },
    })
    sleep(4.8)

    response = http.get('https://pizza-service.saamn.dev/api/order/menu', {
      headers: {
        Host: 'pizza-service.saamn.dev',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vars.authToken}`,
        Origin: 'https://pizza.saamn.dev',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        Priority: 'u=0',
        TE: 'trailers',
      },
    })

    response = http.options('https://pizza-service.saamn.dev/api/order/menu', null, {
      headers: {
        Host: 'pizza-service.saamn.dev',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type',
        Origin: 'https://pizza.saamn.dev',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        Priority: 'u=4',
      },
    })

    response = http.get('https://pizza-service.saamn.dev/api/franchise?page=0&limit=20&name=*', {
      headers: {
        Host: 'pizza-service.saamn.dev',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vars.authToken}`,
        Origin: 'https://pizza.saamn.dev',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        Priority: 'u=4',
        TE: 'trailers',
      },
    })

    response = http.options(
      'https://pizza-service.saamn.dev/api/franchise?page=0&limit=20&name=*',
      null,
      {
        headers: {
          Host: 'pizza-service.saamn.dev',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,content-type',
          Origin: 'https://pizza.saamn.dev',
          Connection: 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          Priority: 'u=4',
          TE: 'trailers',
        },
      }
    )
    sleep(12.1)

    response = http.get('https://pizza-service.saamn.dev/api/user/me', {
      headers: {
        Host: 'pizza-service.saamn.dev',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vars.authToken}`,
        Origin: 'https://pizza.saamn.dev',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        Priority: 'u=0',
        TE: 'trailers',
      },
    })

    response = http.options('https://pizza-service.saamn.dev/api/user/me', null, {
      headers: {
        Host: 'pizza-service.saamn.dev',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type',
        Origin: 'https://pizza.saamn.dev',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        Priority: 'u=4',
        TE: 'trailers',
      },
    })
    sleep(1.3)

    response = http.post(
      'https://pizza-service.saamn.dev/api/order',
      '{"items":[{"menuId":2,"description":"Pepperoni","price":0.0042}],"storeId":"1","franchiseId":1}',
      {
        headers: {
          Host: 'pizza-service.saamn.dev',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vars.authToken}`,
          Origin: 'https://pizza.saamn.dev',
          Connection: 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          Priority: 'u=0',
          TE: 'trailers',
        },
      }
    )

    if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Purchase was *not* 200');
    }
    vars.pizzaJwt = response.json().jwt

    response = http.options('https://pizza-service.saamn.dev/api/order', null, {
      headers: {
        Host: 'pizza-service.saamn.dev',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type',
        Origin: 'https://pizza.saamn.dev',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        Priority: 'u=4',
        TE: 'trailers',
      },
    })
    sleep(3.9)

    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
      JSON.stringify({ jwt: vars.pizzaJwt }),
      {
        headers: {
          Host: 'pizza-factory.cs329.click',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vars.authToken}`,
          Origin: 'https://pizza.saamn.dev',
          'Sec-Fetch-Storage-Access': 'none',
          Connection: 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          Priority: 'u=0',
        },
      }
    )

    response = http.options('https://pizza-factory.cs329.click/api/order/verify', null, {
      headers: {
        Host: 'pizza-factory.cs329.click',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type',
        Origin: 'https://pizza.saamn.dev',
        'Sec-Fetch-Storage-Access': 'none',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        Priority: 'u=4',
      },
    })
  })
}