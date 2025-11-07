import React, { useState, useEffect } from 'react';

function RawData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3003/api/pangyo-raw-data')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setData(data.data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('데이터 로드 실패:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">데이터를 불러올 수 없습니다</div>
      </div>
    );
  }

  const { summary, membershipTypes } = data;

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">전체 요약</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">전체 회원</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{summary.totalMembers.toLocaleString()}명</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">0원 결제</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{summary.zeroPriceMembers.toLocaleString()}명</div>
            <div className="text-xs text-gray-500 mt-1">({(summary.zeroPriceMembers / summary.totalMembers * 100).toFixed(1)}%)</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">유료 결제</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{summary.paidMembers.toLocaleString()}명</div>
            <div className="text-xs text-gray-500 mt-1">({(summary.paidMembers / summary.totalMembers * 100).toFixed(1)}%)</div>
          </div>
        </div>
      </div>

      {/* 멤버십 타입별 상세 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">멤버십 타입별 상세</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  멤버십 타입
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  0원 결제
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유료 결제
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  합계
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  0원 비율
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {membershipTypes.map((type, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {type.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                    {type.zeroPriceCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {type.paidCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {type.totalCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {type.zeroPriceCount > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {(type.zeroPriceCount / type.totalCount * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RawData;
