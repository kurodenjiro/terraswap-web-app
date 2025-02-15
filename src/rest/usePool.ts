import { useEffect, useState } from "react"
import { isAssetInfo, tokenInfos } from "./usePairs"
import { div, gt, times, ceil, plus, minus } from "../libs/math"
import { toAmount } from "../libs/parse"
import { Type } from "../pages/Swap"
import useAPI from "./useAPI"

interface PoolResponse {
  height: string
  result: Pool
}

interface Pool {
  assets: Token[]
  total_share: string
}

interface PoolResult {
  estimated: string
  price1: string
  price2: string
  afterPool: string
  LP: string
  // fromLP: Asset[]
  // text: string
}

export default (
  contract: string,
  symbol: string,
  amount: string,
  type: string,
  balance?: string
) => {
  const [poolLoading, setLoading] = useState(true)
  const { loadPool } = useAPI()

  const [result, setResult] = useState<PoolResult>()
  useEffect(() => {
    if (contract) {
      setLoading(true)
      loadPool(contract)
        .then((res: Pool) => {
          let fromValue = "0"
          let toValue = "0"
          if (
            !(contract === undefined || contract === "" || res === undefined)
          ) {
            if (isAssetInfo(res.assets[1].info)) {
              if (
                tokenInfos.get(res.assets[1].info.token.contract_addr)
                  ?.symbol === symbol
              ) {
                fromValue = res.assets[1].amount
                toValue = res.assets[0].amount
              } else {
                fromValue = res.assets[0].amount
                toValue = res.assets[1].amount
              }
            } else {
              if (
                tokenInfos.get(res.assets[1].info.native_token.denom)
                  ?.symbol === symbol
              ) {
                fromValue = res.assets[1].amount
                toValue = res.assets[0].amount
              } else {
                fromValue = res.assets[0].amount
                toValue = res.assets[1].amount
              }
            }
          }

          const calculatedAmount = toAmount(amount)

          const rate1 = res ? div(fromValue, res.total_share) : "0"
          const rate2 = res ? div(toValue, res.total_share) : "0"

          let price1 = "0"
          let price2 = "0"
          let estimated = "0"
          let LP = "0"
          let afterPool = "0"
          if (type === Type.WITHDRAW) {
            // withdraw
            LP = calculatedAmount
            estimated =
              res && gt(res.total_share, 0) && gt(calculatedAmount, 0)
                ? ceil(times(rate1, LP)) + "-" + ceil(times(rate2, LP))
                : "0"
            price1 =
              res && gt(res.total_share, 0) && gt(calculatedAmount, 0)
                ? div(times(rate1, LP), LP)
                : "0"
            price2 =
              res && gt(res.total_share, 0) && gt(calculatedAmount, 0)
                ? div(times(rate2, LP), LP)
                : "0"
            LP = minus(balance, calculatedAmount)
            afterPool =
              res && gt(res.total_share, 0) && gt(calculatedAmount, 0)
                ? div(LP, plus(res.total_share, LP))
                : "0"
          } else {
            // provide
            LP =
              res && gt(calculatedAmount, 0)
                ? div(calculatedAmount, rate1)
                : "0"
            estimated =
              res && gt(res.total_share, 0) && gt(calculatedAmount, 0)
                ? ceil(times(LP, rate2))
                : "0"
            price1 =
              res && gt(res.total_share, 0) && gt(calculatedAmount, 0)
                ? div(calculatedAmount, LP)
                : "0"
            price2 =
              res && gt(res.total_share, 0) && gt(calculatedAmount, 0)
                ? div(estimated, LP)
                : "0"
            afterPool =
              res && gt(res.total_share, 0) && gt(calculatedAmount, 0)
                ? div(LP, plus(LP, res.total_share))
                : "0"
          }

          setResult({
            price1,
            price2,
            estimated,
            LP,
            afterPool,
          })
        })
        .catch(() => {
          setResult(undefined)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [contract, amount, symbol, loadPool, type, balance])

  return { result, poolLoading }
}
