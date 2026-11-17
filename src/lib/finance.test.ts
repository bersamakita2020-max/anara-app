import assert from 'node:assert/strict'
import test from 'node:test'
import { emergencyLock, recruitmentOpen, splitAmount } from './finance.ts'

test('fase 1 undangan premium tanpa referral', () => {
  const s = splitAmount(350_000, 1, false)
  assert.equal(s.worker, 140_000)
  assert.equal(s.cash, 105_000)
  assert.equal(s.ops, 52_500)
  assert.equal(s.profit, 52_500)
  assert.equal(s.ownerProfit, 31_500)
  assert.equal(s.partnerProfit, 21_000)
})

test('fase 1 skripsi', () => {
  const s = splitAmount(1_500_000, 1, false)
  assert.equal(s.worker, 600_000)
  assert.equal(s.cash, 450_000)
  assert.equal(s.profit, 225_000)
  assert.equal(s.ownerProfit, 135_000)
  assert.equal(s.partnerProfit, 90_000)
})

test('fase 2 situs profil', () => {
  const s = splitAmount(2_500_000, 2, false)
  assert.equal(s.worker, 1_125_000)
  assert.equal(s.cash, 375_000)
  assert.equal(s.ops, 375_000)
  assert.equal(s.profit, 625_000)
  assert.equal(s.ownerProfit, 375_000)
  assert.equal(s.partnerProfit, 250_000)
})

test('referral dipotong sebelum empat pos', () => {
  const s = splitAmount(350_000, 1, true)
  assert.equal(s.referral, 17_500)
  assert.equal(s.base, 332_500)
  assert.equal(s.worker + s.cash + s.ops + s.profit, 332_500)
})

test('dana darurat mengunci 20 persen sampai 5 juta', () => {
  assert.equal(emergencyLock(3_210_000), 642_000)
  assert.equal(emergencyLock(40_000_000), 5_000_000)
})

test('kunci rekrutmen', () => {
  assert.equal(recruitmentOpen([12_000_000, 12_000_000, 11_000_000], 16_000_000), false)
  assert.equal(recruitmentOpen([12_000_000, 13_000_000, 14_000_000], 15_000_000), true)
  assert.equal(recruitmentOpen([12_000_000, 13_000_000, 14_000_000], 14_000_000), false)
})
