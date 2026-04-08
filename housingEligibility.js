/**
 * 토지거래허가제(토허제) 주택 구매 가능 여부 판단 모듈
 *
 * 토허제(토지거래허가제) 구역 내 주택 매수 시 실거주 의무가 있으며,
 * 매수자의 현재 거주지, 보유 주택 현황, 처분 계획 등을 종합적으로 판단합니다.
 */

/**
 * 토허제 구역 주택 매수 가능 여부를 판단합니다.
 *
 * @param {Object} params
 * @param {boolean} params.currentlyResidingInToheoje - 현재 토허제 구역 내 거주 여부 (전세/월세 포함)
 * @param {string}  params.currentResidenceType       - 현재 거주 형태: 'owned' | 'jeonse' | 'monthly' | 'other'
 * @param {number}  params.ownedHomesInToheoje        - 현재 토허제 구역 내 보유 주택 수
 * @param {number}  params.ownedHomesOutsideToheoje   - 현재 토허제 구역 외 보유 주택 수
 * @param {boolean} params.willDisposeNonToheojeHome  - 토허제 외 주택 처분 예정 여부
 * @returns {{ eligible: boolean, reason: string }}
 */
function checkToheojeEligibility(params) {
  const {
    currentlyResidingInToheoje,
    currentResidenceType,
    ownedHomesInToheoje,
    ownedHomesOutsideToheoje,
    willDisposeNonToheojeHome,
  } = params;

  // 토허제 구역 내 기보유 주택이 있는 경우 추가 매수 불가
  if (ownedHomesInToheoje > 0) {
    return {
      eligible: false,
      reason:
        '토허제 구역 내에 이미 보유 주택이 있어 동일 구역 내 추가 주택 매수가 불가합니다.',
    };
  }

  // 토허제 구역 외 보유 주택이 있고 처분 의사가 없는 경우
  if (ownedHomesOutsideToheoje > 0 && !willDisposeNonToheojeHome) {
    return {
      eligible: false,
      reason:
        '토허제 구역 외 보유 주택을 처분하지 않으면 토허제 구역 내 주택 매수가 허가되지 않을 수 있습니다. ' +
        '매수 후 실거주 의무를 이행하기 위해 기존 주택 처분이 필요합니다.',
    };
  }

  // 현재 토허제 구역에 전세/월세로 거주 중이고, 토허제 외 주택을 처분할 예정인 경우
  if (
    currentlyResidingInToheoje &&
    (currentResidenceType === 'jeonse' || currentResidenceType === 'monthly') &&
    ownedHomesOutsideToheoje > 0 &&
    willDisposeNonToheojeHome
  ) {
    return {
      eligible: true,
      reason:
        '토허제 구역 외 주택을 처분하고, 현재 토허제 구역 내에 전세/월세로 거주 중이므로 ' +
        '실거주 요건을 충족할 수 있습니다. 토허제 구역 내 주택 매수가 가능합니다. ' +
        '단, 매수 후 2년 이내 실거주를 개시하고 의무 거주 기간을 준수해야 합니다.',
    };
  }

  // 토허제 구역 외 주택이 없고 (또는 처분 예정), 토허제 구역 내 거주 중
  if (
    currentlyResidingInToheoje &&
    (ownedHomesOutsideToheoje === 0 || willDisposeNonToheojeHome)
  ) {
    return {
      eligible: true,
      reason:
        '현재 토허제 구역 내에 거주 중이며 기존 주택 처분 조건을 충족하여 ' +
        '토허제 구역 내 주택 매수가 가능합니다. ' +
        '단, 매수 후 실거주 의무(통상 2년) 준수가 필요합니다.',
    };
  }

  // 토허제 구역 외 거주 중이고 보유 주택 없음
  if (!currentlyResidingInToheoje && ownedHomesOutsideToheoje === 0) {
    return {
      eligible: true,
      reason:
        '현재 보유 주택이 없으며 토허제 구역 내 주택 매수 후 실거주 의무를 이행하면 허가가 가능합니다.',
    };
  }

  // 그 외 일반적 불가 케이스
  return {
    eligible: false,
    reason:
      '현재 조건으로는 토허제 구역 내 주택 매수 허가 요건을 충족하지 못합니다. ' +
      '실거주 의무 및 주택 보유 현황을 다시 확인해 주세요.',
  };
}

/**
 * Express 핸들러: POST /api/housing-eligibility
 * Body(JSON):
 *   currentlyResidingInToheoje  {boolean}
 *   currentResidenceType        {string}  'owned' | 'jeonse' | 'monthly' | 'other'
 *   ownedHomesInToheoje         {number}
 *   ownedHomesOutsideToheoje    {number}
 *   willDisposeNonToheojeHome   {boolean}
 */
function checkEligibilityHandler(req, res, next) {
  try {
    const {
      currentlyResidingInToheoje,
      currentResidenceType,
      ownedHomesInToheoje,
      ownedHomesOutsideToheoje,
      willDisposeNonToheojeHome,
    } = req.body;

    const validResidenceTypes = ['owned', 'jeonse', 'monthly', 'other'];

    // 필수 파라미터 존재 및 타입 검증
    if (typeof currentlyResidingInToheoje !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'currentlyResidingInToheoje 는 boolean 이어야 합니다.',
      });
    }
    if (
      typeof currentResidenceType !== 'string' ||
      !validResidenceTypes.includes(currentResidenceType)
    ) {
      return res.status(400).json({
        status: 'error',
        message:
          'currentResidenceType 의 값이 올바르지 않습니다. ' +
          "허용 값: 'owned' | 'jeonse' | 'monthly' | 'other'",
      });
    }
    if (
      typeof ownedHomesInToheoje !== 'number' ||
      !Number.isInteger(ownedHomesInToheoje) ||
      ownedHomesInToheoje < 0
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'ownedHomesInToheoje 는 0 이상의 정수이어야 합니다.',
      });
    }
    if (
      typeof ownedHomesOutsideToheoje !== 'number' ||
      !Number.isInteger(ownedHomesOutsideToheoje) ||
      ownedHomesOutsideToheoje < 0
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'ownedHomesOutsideToheoje 는 0 이상의 정수이어야 합니다.',
      });
    }
    if (typeof willDisposeNonToheojeHome !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'willDisposeNonToheojeHome 는 boolean 이어야 합니다.',
      });
    }

    const result = checkToheojeEligibility({
      currentlyResidingInToheoje,
      currentResidenceType,
      ownedHomesInToheoje,
      ownedHomesOutsideToheoje,
      willDisposeNonToheojeHome,
    });

    return res.status(200).json({
      status: 'success',
      eligible: result.eligible,
      reason: result.reason,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  checkToheojeEligibility,
  checkEligibilityHandler,
};
