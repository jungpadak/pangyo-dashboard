import { useState, useEffect } from 'react'

function SegmentView() {
  const [segmentData, setSegmentData] = useState(null)
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [showSubSegments, setShowSubSegments] = useState(false)
  const [members, setMembers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)

  // Fetch segment statistics
  useEffect(() => {
    fetchSegmentData()
  }, [])

  // Fetch member list when segment is selected or page changes
  useEffect(() => {
    fetchSegmentMembers(selectedSegment, currentPage)
  }, [selectedSegment, currentPage])

  const fetchSegmentData = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3003/api/pangyo-segments')
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
      const response = await fetch(`http://localhost:3003/api/pangyo-segment-members/${segment}?page=${page}`)
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
      {/* Segment Filter Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">회원 세그먼트</h2>

        {/* Main Segments */}
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
            <div className="text-sm font-medium text-gray-500 mb-1">전체</div>
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

        {/* Existing Sub-Segments (Collapsible) */}
        {showSubSegments && (
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {segmentNames[selectedSegment]} 명단
          </h2>
          <div className="text-sm text-gray-500">
            총 {members.length}명
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
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
                    ))}
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
