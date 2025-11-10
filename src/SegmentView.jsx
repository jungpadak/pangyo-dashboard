import { useState, useEffect, useMemo } from 'react'

function SegmentView() {
  const [view, setView] = useState('valid') // 'valid' or 'all'
  const [segmentData, setSegmentData] = useState(null)
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all') // 'all', 'active', 'expired'
  const [showSubSegments, setShowSubSegments] = useState(false)
  const [members, setMembers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch segment statistics
  useEffect(() => {
    fetchSegmentData()
  }, [view])

  // Fetch member list when segment is selected or page changes
  useEffect(() => {
    fetchSegmentMembers(selectedSegment, currentPage)
  }, [selectedSegment, currentPage, searchTerm])

  const fetchSegmentData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pangyo-segments?view=${view}`)
      const result = await response.json()
      if (result.success) {
        setSegmentData(result.data)
      }
    } catch (error) {
      console.error('Error fetching segment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSegmentMembers = async (segment, page) => {
    try {
      setMembersLoading(true)

      // view='all'일 때는 새로운 API 사용
      let apiUrl
      if (view === 'all') {
        const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
        apiUrl = `/api/pangyo-all-members?page=${page}${searchParam}`
      } else {
        const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
        apiUrl = `/api/pangyo-segment-members/${segment}?page=${page}${searchParam}`
      }

      const response = await fetch(apiUrl)
      const result = await response.json()
      if (result.success) {
        setMembers(result.data.members)
        setTotalPages(result.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching segment members:', error)
    } finally {
      setMembersLoading(false)
    }
  }

  const handleSegmentClick = (segment) => {
    if (segment === 'existing') {
      setShowSubSegments(!showSubSegments)
    } else {
      setSelectedSegment(segment)
      setCurrentPage(1)
      if (segment !== 'existing') {
        setShowSubSegments(false)
      }
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // CSV 다운로드 함수
  const handleDownloadCSV = async () => {
    try {
      // 전체 데이터를 가져오기 위해 limit을 크게 설정
      let apiUrl
      if (view === 'all') {
        const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
        apiUrl = `/api/pangyo-all-members?page=1&limit=10000${searchParam}`
      } else {
        const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
        apiUrl = `/api/pangyo-segment-members/${selectedSegment}?page=1&limit=10000${searchParam}`
      }

      const response = await fetch(apiUrl)
      const result = await response.json()

      if (!result.success) {
        alert('데이터를 가져오는 데 실패했습니다.')
        return
      }

      let allMembers = result.data.members

      // 필터 적용
      if (view === 'all' && selectedStatus !== 'all') {
        allMembers = allMembers.filter(member => {
          const hasActiveMatch = member.memberships?.some(m => !m.isExpired)
          const hasExpiredMatch = member.memberships?.some(m => m.isExpired)

          if (selectedStatus === 'active') {
            return hasActiveMatch
          } else {
            return hasExpiredMatch
          }
        })
      }

      // CSV 변환
      const headers = ['ID', '회원명', '연락처', '소속법인', '입주사구분', '회원구분', '유효 멤버십', '만료 멤버십']
      const csvContent = [
        headers.join(','),
        ...allMembers.map(member => {
          if (view === 'all') {
            // 전체 회원 보기
            const validMemberships = member.memberships?.filter(m => !m.isExpired).map(m => m.title).join('; ') || '-'
            const expiredMemberships = member.memberships?.filter(m => m.isExpired).map(m => m.title).join('; ') || '-'

            return [
              member.userId || '-',
              `"${member.userName || '-'}"`,
              member.userPhone || '-',
              `"${member.companyName || '정보없음'}"`,
              member.tenantType || '-',
              member.memberType || '-',
              `"${validMemberships}"`,
              `"${expiredMemberships}"`
            ].join(',')
          } else {
            // 유효회원 보기
            return [
              member.userId || '-',
              `"${member.userName || '-'}"`,
              member.userPhone || '-',
              `"${member.companyName || '정보없음'}"`,
              member.tenantType || '-',
              member.memberType || '-',
              `"${member.membershipTitle || '-'}"`,
              '-'
            ].join(',')
          }
        })
      ].join('\n')

      // BOM 추가하여 한글 깨짐 방지
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      const fileName = view === 'all'
        ? (selectedStatus === 'active' ? '유효회원_명단.csv' : selectedStatus === 'expired' ? '만료회원_명단.csv' : '전체회원_명단.csv')
        : `${segmentNames[selectedSegment]}_명단.csv`
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('CSV 다운로드 오류:', error)
      alert('CSV 다운로드 중 오류가 발생했습니다.')
    }
  }

  // Filter members based on status only (search is handled by server)
  const filteredMembers = useMemo(() => {
    let filtered = members

    // For view='all', members are user-grouped with memberships array
    if (view === 'all' && selectedStatus !== 'all') {
      const now = new Date()
      filtered = filtered.filter(member => {
        // Check if user has any active or expired memberships based on filter
        const hasActiveMatch = member.memberships?.some(m => !m.isExpired)
        const hasExpiredMatch = member.memberships?.some(m => m.isExpired)

        if (selectedStatus === 'active') {
          return hasActiveMatch
        } else {
          return hasExpiredMatch
        }
      })
    }

    // Search is now handled by server for both views
    return filtered
  }, [members, view, selectedStatus])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">데이터를 불러오는 중...</div>
      </div>
    )
  }

  const segmentNames = {
    all: '전체 회원',
    existing: '기존 회원',
    new: '신규 회원',
    wemade: '위메이드',
    otherTenant: '위메이드 외',
    nonTenant: '비입주사'
  }

  return (
    <div className="space-y-6">
      {/* View Switcher */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">회원 보기</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setView('valid')
                setSelectedSegment('all')
                setSelectedStatus('all')
                setShowSubSegments(false)
                setSearchTerm('')
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'valid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              유효회원 (피트니스 멤버십)
            </button>
            <button
              onClick={() => {
                setView('all')
                setSelectedSegment('all')
                setSelectedStatus('all')
                setShowSubSegments(false)
                setSearchTerm('')
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              전체 회원 (모든 타입)
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {view === 'valid'
            ? '피트니스 멤버십 회원만 표시 (1일권, 체험, PT 등 제외)'
            : '1일권, 체험, PT, 골프락커 등 모든 타입의 회원 포함'}
        </p>
      </div>

      {/* Segment Filter Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {view === 'valid' ? '유효회원 세그먼트' : '전체 회원 세그먼트'}
        </h2>

        {/* Main Segments */}
        {view === 'all' ? (
          // 전체 회원 뷰: 전체/유효/만료만 표시
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* All Members */}
            <div
              className={`bg-white rounded-lg shadow p-6 border-2 cursor-pointer transition-all ${
                selectedStatus === 'all'
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                setSelectedStatus('all')
                setCurrentPage(1)
              }}
            >
              <div className="text-sm font-medium text-gray-500 mb-1">전체 회원</div>
              <div className="text-3xl font-bold text-gray-900">{segmentData?.total || 0}</div>
              <div className="text-xs text-gray-400 mt-1">명</div>
            </div>

            {/* Active Members */}
            <div
              className={`bg-white rounded-lg shadow p-6 border-2 cursor-pointer transition-all ${
                selectedStatus === 'active'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
              onClick={() => {
                setSelectedStatus('active')
                setCurrentPage(1)
              }}
            >
              <div className="text-sm font-medium text-gray-500 mb-1">유효 멤버십</div>
              <div className="text-3xl font-bold text-green-600">
                {segmentData?.active?.total || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                전체의 {segmentData?.active?.percentage || 0}%
              </div>
            </div>

            {/* Expired Members */}
            <div
              className={`bg-white rounded-lg shadow p-6 border-2 cursor-pointer transition-all ${
                selectedStatus === 'expired'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
              onClick={() => {
                setSelectedStatus('expired')
                setCurrentPage(1)
              }}
            >
              <div className="text-sm font-medium text-gray-500 mb-1">만료 멤버십</div>
              <div className="text-3xl font-bold text-red-600">
                {segmentData?.expired?.total || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                전체의 {segmentData?.expired?.percentage || 0}%
              </div>
            </div>
          </div>
        ) : (
          // 유효회원 뷰: 전체/기존/신규 표시
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* All */}
            <div
              className={`bg-white rounded-lg shadow p-6 border-2 cursor-pointer transition-all ${
                selectedSegment === 'all'
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSegmentClick('all')}
            >
              <div className="text-sm font-medium text-gray-500 mb-1">유효회원 전체</div>
              <div className="text-3xl font-bold text-gray-900">{segmentData?.total || 0}</div>
              <div className="text-xs text-gray-400 mt-1">명</div>
            </div>

            {/* Existing */}
            <div
              className={`bg-white rounded-lg shadow p-6 border-2 cursor-pointer transition-all ${
                selectedSegment === 'existing' || showSubSegments
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleSegmentClick('existing')}
            >
              <div className="text-sm font-medium text-gray-500 mb-1">
                기존 회원
                {showSubSegments && <span className="ml-2 text-xs">▼</span>}
                {!showSubSegments && <span className="ml-2 text-xs">▶</span>}
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {segmentData?.segments.existing.count || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                전체의 {segmentData?.segments.existing.percentage || 0}%
              </div>
            </div>

            {/* New */}
            <div
              className={`bg-white rounded-lg shadow p-6 border-2 cursor-pointer transition-all ${
                selectedSegment === 'new'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
              onClick={() => handleSegmentClick('new')}
            >
              <div className="text-sm font-medium text-gray-500 mb-1">신규 회원</div>
              <div className="text-3xl font-bold text-green-600">
                {segmentData?.segments.new.count || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                전체의 {segmentData?.segments.new.percentage || 0}%
              </div>
            </div>
          </div>
        )}

        {/* Existing Sub-Segments (Collapsible) - 유효회원 뷰에서만 */}
        {view === 'valid' && showSubSegments && (
          <div className="ml-8 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">기존 회원 세부 구분</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Wemade */}
              <div
                className={`bg-white rounded-lg shadow-sm p-4 border-2 cursor-pointer transition-all ${
                  selectedSegment === 'wemade'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => handleSegmentClick('wemade')}
              >
                <div className="text-xs font-medium text-gray-500 mb-1">입주사 (위메이드)</div>
                <div className="text-2xl font-bold text-purple-600">
                  {segmentData?.segments.existing.subSegments.wemade.count || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  기존의 {segmentData?.segments.existing.subSegments.wemade.percentage || 0}%
                </div>
              </div>

              {/* Other Tenant */}
              <div
                className={`bg-white rounded-lg shadow-sm p-4 border-2 cursor-pointer transition-all ${
                  selectedSegment === 'otherTenant'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => handleSegmentClick('otherTenant')}
              >
                <div className="text-xs font-medium text-gray-500 mb-1">입주사 (위메이드 외)</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {segmentData?.segments.existing.subSegments.otherTenant.count || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  기존의 {segmentData?.segments.existing.subSegments.otherTenant.percentage || 0}%
                </div>
              </div>

              {/* Non Tenant */}
              <div
                className={`bg-white rounded-lg shadow-sm p-4 border-2 cursor-pointer transition-all ${
                  selectedSegment === 'nonTenant'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
                onClick={() => handleSegmentClick('nonTenant')}
              >
                <div className="text-xs font-medium text-gray-500 mb-1">비입주사</div>
                <div className="text-2xl font-bold text-orange-600">
                  {segmentData?.segments.existing.subSegments.nonTenant.count || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  기존의 {segmentData?.segments.existing.subSegments.nonTenant.percentage || 0}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member List */}
      <div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {view === 'all' && selectedStatus === 'active' ? '유효 멤버십 회원 명단' :
               view === 'all' && selectedStatus === 'expired' ? '만료 멤버십 회원 명단' :
               view === 'all' ? '전체 회원 명단' :
               segmentNames[selectedSegment] + ' 명단'}
            </h2>
          </div>

          {/* Search Bar & Download Button */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="회원명, 연락처, 소속법인으로 검색..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              CSV 다운로드
            </button>
            <div className="text-sm text-gray-500 whitespace-nowrap">
              총 {filteredMembers.length}명
            </div>
          </div>
        </div>

        {membersLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-500">회원 명단을 불러오는 중...</div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {view === 'all' ? (
                        // 전체 회원 뷰: 회원별 그룹화 테이블 헤더
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            회원명
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            연락처
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            소속법인
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            입주사구분
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            회원구분
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            유효 멤버십
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            만료 멤버십
                          </th>
                        </>
                      ) : (
                        // 유효회원 뷰: 기존 테이블 헤더
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            회원명
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            연락처
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            소속법인
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            입주사구분
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            회원구분
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            멤버십 상품명
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            시작일
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            종료일
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            결제금액
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {view === 'all' ? (
                      // 전체 회원 뷰: 회원별 그룹화 테이블
                      filteredMembers.map((member) => {
                        const activeMemberships = member.memberships?.filter(m => !m.isExpired) || []
                        const expiredMemberships = member.memberships?.filter(m => m.isExpired) || []

                        return (
                          <tr key={member.userId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.userId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.userName || '정보없음'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {member.userPhone || '정보없음'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.companyName ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {member.companyName}
                                </span>
                              ) : (
                                <span className="text-gray-400">정보없음</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {member.tenantType || '정보없음'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.memberType === '기존'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {member.memberType || '신규'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {activeMemberships.length > 0 ? (
                                <div className="space-y-1">
                                  {activeMemberships.map((m, idx) => (
                                    <div key={idx} className="text-xs">
                                      <div className="font-medium text-green-700">
                                        {m.type === 'option' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-1">옵션</span>}
                                        {m.title}
                                      </div>
                                      <div className="text-gray-500">
                                        {new Date(m.beginDate).toLocaleDateString('ko-KR')} ~ {new Date(m.endDate).toLocaleDateString('ko-KR')}
                                      </div>
                                      <div className="text-gray-600">{(m.totalPrice || 0).toLocaleString()}원</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {expiredMemberships.length > 0 ? (
                                <div className="space-y-1">
                                  {expiredMemberships.map((m, idx) => (
                                    <div key={idx} className="text-xs">
                                      <div className="font-medium text-red-700">
                                        {m.type === 'option' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-1">옵션</span>}
                                        {m.title}
                                      </div>
                                      <div className="text-gray-500">
                                        {new Date(m.beginDate).toLocaleDateString('ko-KR')} ~ {new Date(m.endDate).toLocaleDateString('ko-KR')}
                                      </div>
                                      <div className="text-gray-600">{(m.totalPrice || 0).toLocaleString()}원</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      // 유효회원 뷰: 기존 테이블 (멤버십별)
                      filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.userName || '정보없음'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.userPhone || '정보없음'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.companyName ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {member.companyName}
                              </span>
                            ) : (
                              <span className="text-gray-400">정보없음</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.tenantType || '정보없음'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.memberType === '기존'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {member.memberType || '신규'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {member.membershipTitle}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(member.beginDate).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(member.endDate).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(member.totalPrice || 0).toLocaleString()}원
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded text-sm ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return <span key={page} className="px-2 text-gray-400">...</span>
                    }
                    return null
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SegmentView
