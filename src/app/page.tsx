"use client";

import { useState, useMemo } from "react";
import { Plus, Minus, Package, Clock, MapPin, Truck, DollarSign, MessageSquare, FileText, Download, CheckCircle, Trash2, CheckCircle2 } from "lucide-react";

type Client = {
  id: string;
  name: string;
  time: string;
  lunchboxes: number;
  salads: number;
  payment: string;
  price: string;
  memo?: string;
  isPaid: boolean;
  isCollected: boolean;
  mockPreviousQty: number;
};

const initialClients: Client[] = [
  { id: '1', name: '답십리 오승현내과', time: '11:50', lunchboxes: 3, salads: 1, payment: '당일결제', price: '8,000원', isPaid: false, isCollected: false, mockPreviousQty: 4 },
  { id: '2', name: '군자 척편안의원', time: '12:30', lunchboxes: 15, salads: 5, payment: '월결제', price: '8,000원', isPaid: false, isCollected: false, mockPreviousQty: 22 },
  { id: '3', name: '답십리 마디튼튼의원', time: '12:00', lunchboxes: 11, salads: 4, payment: '주결제', price: '8,200원', isPaid: false, isCollected: false, mockPreviousQty: 14 },
  { id: '4', name: '용마산 민트치과', time: '12:50', lunchboxes: 2, salads: 0, payment: '당일결제', price: '8,000원', memo: "음료X", isPaid: false, isCollected: false, mockPreviousQty: 2 },
  { id: '5', name: '광진구 그대의봄의원', time: '12:40', lunchboxes: 5, salads: 3, payment: '월결제', price: '8,000원', isPaid: false, isCollected: false, mockPreviousQty: 7 },
  { id: '6', name: '면목 바른선택치과', time: '12:40', lunchboxes: 5, salads: 2, payment: '주결제', price: '8,000원', isPaid: false, isCollected: false, mockPreviousQty: 8 },
];

function getSaladPacks(total: number) {
  if (total === 0) return { pack3: 0, pack2: 0, pack1: 0 };
  
  if (total % 3 === 1 && total >= 4) {
    const pack3 = Math.floor(total / 3) - 1;
    return { pack3, pack2: 2, pack1: 0 };
  } else {
    const pack3 = Math.floor(total / 3);
    const rem = total % 3;
    const pack2 = rem === 2 ? 1 : 0;
    const pack1 = rem === 1 ? 1 : 0;
    return { pack3, pack2, pack1 };
  }
}

type PaymentGroup = { 
  totalQty: number; 
  totalAmount: number; 
  collectedAmount: number; 
  pendingAmount: number; 
  lunchboxes: number; 
  salads: number; 
  items: (Client & { qty: number, amount: number, priceNum: number })[] 
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"admin" | "driver" | "transaction" | "feedback">("admin");
  const [clients, setClients] = useState<Client[]>(initialClients);

  const updateQuantity = (id: string, field: "lunchboxes" | "salads", delta: number) => {
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        const newValue = Math.max(0, c[field] + delta);
        return { ...c, [field]: newValue };
      }
      return c;
    }));
  };

  const toggleProperty = (id: string, field: "isPaid" | "isCollected") => {
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, [field]: !c[field] };
      }
      return c;
    }));
  };

  const totals = useMemo(() => {
    return clients.reduce((acc, c) => ({
      lunchboxes: acc.lunchboxes + c.lunchboxes,
      salads: acc.salads + c.salads
    }), { lunchboxes: 0, salads: 0 });
  }, [clients]);

  const saladPacks = useMemo(() => getSaladPacks(totals.salads), [totals.salads]);

  const transactionGroups = useMemo(() => {
    const groups: Record<string, PaymentGroup> = {
      '당일결제': { totalQty: 0, totalAmount: 0, collectedAmount: 0, pendingAmount: 0, lunchboxes: 0, salads: 0, items: [] },
      '주결제':   { totalQty: 0, totalAmount: 0, collectedAmount: 0, pendingAmount: 0, lunchboxes: 0, salads: 0, items: [] },
      '월결제':   { totalQty: 0, totalAmount: 0, collectedAmount: 0, pendingAmount: 0, lunchboxes: 0, salads: 0, items: [] },
    };
  
    clients.forEach(c => {
      const qty = c.lunchboxes + c.salads;
      const priceNum = parseInt(c.price.replace(/[^0-9]/g, ''));
      const amount = qty * priceNum;
      
      if (groups[c.payment]) {
        groups[c.payment].totalQty += qty;
        groups[c.payment].lunchboxes += c.lunchboxes;
        groups[c.payment].salads += c.salads;
        groups[c.payment].totalAmount += amount;
        
        if (c.payment === '당일결제') {
          if (c.isPaid) groups[c.payment].collectedAmount += amount;
          else groups[c.payment].pendingAmount += amount;
        }

        groups[c.payment].items.push({ ...c, qty, priceNum, amount });
      }
    });
  
    return groups;
  }, [clients]);

  const exportExcel = async () => {
    const data = [
      ['날짜', '업체명', '품목', '수량', '단가', '공급가액', '부가세', '합계액', '결제방식', '수금여부']
    ];
    
    let grandTotal = 0;
    const today = new Date().toLocaleDateString('ko-KR');

    clients.forEach(c => {
      const qty = c.lunchboxes + c.salads;
      const price = parseInt(c.price.replace(/[^0-9]/g, ''));
      const total = qty * price;
      grandTotal += total;
      
      const supply = Math.round(total / 1.1);
      const vat = total - supply;
      
      data.push([
        today,
        c.name,
        `위드런치 도시락 (${c.lunchboxes}) / 샐러드 (${c.salads})`,
        qty.toString(),
        price.toString(),
        supply.toString(),
        vat.toString(),
        total.toString(),
        c.payment,
        c.payment === '당일결제' ? (c.isPaid ? 'O' : 'X') : '-'
      ]);
    });

    data.push(['', '총계', '', '', '', '', '', grandTotal.toString(), '', '']);

    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "거래명세서");
      XLSX.writeFile(wb, `위드런치_거래명세서_${today.replace(/\. /g, '').replace(/\./g, '')}.xlsx`);
    } catch (e) {
      console.error("Failed to export Excel", e);
      alert("엑셀 내보내기 오류: xlsx 라이브러리를 확인해주세요.");
    }
  };

  const exportDriverExcel = async () => {
    const data = [];
    const totalSum = totals.lunchboxes + totals.salads;
    const packingText = `${saladPacks.pack3 > 0 ? `3인 ${saladPacks.pack3}팩 ` : ''}${saladPacks.pack2 > 0 ? `2인 ${saladPacks.pack2}팩 ` : ''}${saladPacks.pack1 > 0 ? `1인 ${saladPacks.pack1}팩` : ''}`.trim();
    
    data.push([
      '천국',
      `도: ${totals.lunchboxes}`,
      `샐: ${totals.salads}`,
      `합계: ${totalSum}`,
      `패킹지시: ${packingText || '없음'}`
    ]);
    
    data.push([]); // Empty spacing
    data.push(['원', '상호명', '도', '샐', '합계', '내용', '결제']);
    
    clients.forEach(c => {
      const qty = c.lunchboxes + c.salads;
      const priceNum = parseInt(c.price.replace(/[^0-9]/g, ''));
      const unitValue = priceNum / 1000;
      
      let memoInfo = `${c.time}`;
      if (c.memo) memoInfo += ` / ${c.memo}`;
      memoInfo += ` / 수거예정:${c.mockPreviousQty}개`;
      
      if (c.payment === '당일결제') {
        memoInfo += ` / 수금:${c.isPaid ? 'O' : 'X'}`;
      }
      
      data.push([
        unitValue,
        c.name,
        c.lunchboxes,
        c.salads,
        qty,
        memoInfo,
        c.payment
      ]);
    });

    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      ws['!cols'] = [
        { wch: 4 },
        { wch: 18 },
        { wch: 4 },
        { wch: 4 },
        { wch: 5 },
        { wch: 35 },
        { wch: 10 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "배송표_천국");
      
      const today = new Date().toLocaleDateString('ko-KR').replace(/\. /g, '').replace(/\./g, '');
      XLSX.writeFile(wb, `배송표_천국_${today}.xlsx`);
    } catch (e) {
      console.error("Failed to export Driver Excel", e);
      alert("엑셀 내보내기 오류: xlsx 라이브러리를 확인해주세요.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* Desktop Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-100 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] hidden md:flex flex-col shrink-0 z-20 h-full">
        <div className="p-6 pt-8 pb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#EB5722] flex items-center justify-center text-white shadow-sm">
              <Package className="w-5 h-5" />
            </span>
            위드런치
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 flex flex-col">
          <p className="text-xs font-semibold text-slate-400 px-3 pt-2 pb-3">대시보드 메뉴</p>
          
          <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'admin' ? 'bg-[#FFF5F0] text-[#EB5722]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
            <Package className="w-4.5 h-4.5" /> 📦 전체 주문 현황
          </button>
          
          <button onClick={() => setActiveTab('driver')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'driver' ? 'bg-[#FFF5F0] text-[#EB5722]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
            <Truck className="w-4.5 h-4.5" /> 🚚 배달원 UI
          </button>
          
          <button onClick={() => setActiveTab('transaction')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'transaction' ? 'bg-[#FFF5F0] text-[#EB5722]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
            <DollarSign className="w-4.5 h-4.5" /> 💰 거래 현황
          </button>
          
          <button onClick={() => setActiveTab('feedback')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'feedback' ? 'bg-[#FFF5F0] text-[#EB5722]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
            <MessageSquare className="w-4.5 h-4.5" /> 📊 고객 피드백
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-slate-50 h-full pb-20 md:pb-0">
        
        {/* Mobile Top App Bar */}
        <div className="md:hidden sticky top-0 bg-white border-b border-slate-100 p-4 z-20 shadow-sm flex items-center justify-center">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#EB5722] flex items-center justify-center text-white shadow-sm">
              <Package className="w-3.5 h-3.5" />
            </span>
            위드런치
          </h1>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          
          {activeTab === "admin" && (
            <div className="animate-in fade-in flex flex-col gap-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 hidden md:block">📦 전체 주문 현황</h2>
              
              {/* Admin View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-500 mb-1">천국기사 총 배달량</h3>
                  <div className="flex items-center gap-6 mt-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 font-medium">도시락</p>
                      <p className="text-3xl md:text-4xl font-bold text-slate-900">{totals.lunchboxes}<span className="text-base font-medium text-slate-400 ml-1">개</span></p>
                    </div>
                    <div className="w-px h-10 bg-slate-100" />
                    <div>
                      <p className="text-xs text-slate-500 mb-1 font-medium">샐러드</p>
                      <p className="text-3xl md:text-4xl font-bold text-[#EB5722]">{totals.salads}<span className="text-base font-medium text-[#EB5722]/60 ml-1">개</span></p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#FFF5F0] p-5 md:p-6 rounded-2xl border border-[#EB5722]/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Package className="w-24 h-24 md:w-32 md:h-32" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#EB5722] mb-4">샐러드 패킹 지시서 ({totals.salads}개)</h3>
                  <div className="grid grid-cols-3 gap-2 md:gap-3 relative z-10">
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm text-center border border-[#EB5722]/20">
                      <p className="text-[10px] md:text-xs text-slate-500 mb-1 font-medium">3인용</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-800">{saladPacks.pack3}팩</p>
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm text-center border border-[#EB5722]/20">
                      <p className="text-[10px] md:text-xs text-slate-500 mb-1 font-medium">2인용</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-800">{saladPacks.pack2}팩</p>
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm text-center border border-[#EB5722]/20">
                      <p className="text-[10px] md:text-xs text-slate-500 mb-1 font-medium">1인용</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-800">{saladPacks.pack1}팩</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-2">
                <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-bold text-slate-900">배송 리스트 (천국)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-4 md:px-6 py-3 text-xs font-semibold text-slate-500">고객명</th>
                        <th className="px-4 md:px-6 py-3 text-xs font-semibold text-slate-500">시간</th>
                        <th className="px-4 md:px-6 py-3 text-xs font-semibold text-slate-500">도시락</th>
                        <th className="px-4 md:px-6 py-3 text-xs font-semibold text-slate-500">샐러드</th>
                        <th className="px-4 md:px-6 py-3 text-xs font-semibold text-slate-500">결제</th>
                        <th className="px-4 md:px-6 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">단가/메모</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clients.map(client => {
                        const isToday = client.payment === "당일결제";
                        return (
                          <tr key={client.id} className={`group transition-colors hover:bg-slate-50/50 ${isToday ? "bg-red-50/20" : ""}`}>
                            <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-900 flex items-center gap-2 text-sm md:text-base">
                              {isToday && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                              {client.name}
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] md:text-sm font-medium">
                                <Clock className="w-3 md:w-3.5 h-3 md:h-3.5" />
                                {client.time}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4">
                              <div className="flex items-center gap-2 md:gap-3">
                                <button onClick={() => updateQuantity(client.id, "lunchboxes", -1)} className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                                  <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                                <span className="w-4 md:w-6 text-center font-bold text-slate-800 text-sm md:text-base">{client.lunchboxes}</span>
                                <button onClick={() => updateQuantity(client.id, "lunchboxes", 1)} className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                                  <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4">
                              <div className="flex items-center gap-2 md:gap-3">
                                <button onClick={() => updateQuantity(client.id, "salads", -1)} className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                                  <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                                <span className="w-4 md:w-6 text-center font-bold text-slate-800 text-sm md:text-base">{client.salads}</span>
                                <button onClick={() => updateQuantity(client.id, "salads", 1)} className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-slate-200 flex items-center justify-center text-[#EB5722] hover:bg-[#FFF5F0] border-[#EB5722]/30 transition-colors">
                                  <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4">
                              <span className={`inline-flex px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[10px] md:text-xs font-bold ${isToday ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                                {client.payment}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-slate-500">
                              <div className="font-semibold text-slate-700">{client.price}</div>
                              {client.memo && <div className="text-[10px] md:text-xs text-[#EB5722] font-bold mt-0.5">{client.memo}</div>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "driver" && (
            <div className="animate-in fade-in flex flex-col items-center">
              <div className="w-full flex justify-end md:justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 hidden md:block">🚚 배달원 모바일 UI</h2>
                {/* Excel Download for Driver Sheet */}
                <button
                  onClick={exportDriverExcel}
                  className="w-full md:w-auto bg-slate-900 border rounded-xl px-4 py-3 flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 text-white font-bold hover:bg-slate-800 active:scale-[0.98] transition-all text-sm md:text-base"
                >
                  <FileText className="w-4.5 h-4.5 text-white/80" />
                  배송표 엑셀 다운로드
                </button>
              </div>
              
              {/* Mobile View Simulator */}
              <div className="w-full max-w-sm border-0 md:border-[12px] md:border-slate-900 md:rounded-[3rem] bg-slate-50 md:shadow-2xl relative overflow-hidden flex flex-col min-h-screen md:min-h-0 md:h-[820px] shrink-0 mx-auto">
                {/* Dynamic Island Area (Only visible on Desktop mockup) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20 hidden md:block"></div>

                {/* Mobile Header */}
                <div className="bg-[#EB5722] px-6 pt-8 md:pt-12 pb-6 text-white shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                  <div className="relative z-10">
                    <p className="text-white/90 text-xs md:text-sm font-medium mb-1">오늘의 상차 정보</p>
                    <h2 className="text-xl md:text-2xl font-bold mb-4">천국 기사님, 안전운전!</h2>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-white/80 text-[10px] md:text-xs mb-1 font-medium">신규 배송</p>
                          <p className="text-2xl md:text-3xl font-black leading-none">{totals.lunchboxes + totals.salads}<span className="text-xs md:text-sm opacity-80 font-normal ml-0.5">팩</span></p>
                        </div>
                        <div className="w-px h-8 bg-white/20" />
                        <div className="text-right">
                          <p className="text-white/80 text-[10px] md:text-xs mb-1 font-medium">포장 수량</p>
                          <p className="text-sm md:text-base font-bold leading-tight">
                            기본 <span className="bg-white/20 px-1 py-0.5 rounded ml-1 text-sm">{totals.lunchboxes}</span>
                          </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[#FFF5F0]/70 text-[10px] md:text-xs mb-1 font-medium">샐러드</p>
                           <p className="text-sm md:text-base font-bold leading-tight text-[#FFF5F0]">
                             추가 <span className="bg-white/20 px-1 py-0.5 rounded ml-1 text-sm">{totals.salads}</span>
                           </p>
                        </div>
                      </div>
                      
                      {totals.salads > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/20">
                          <p className="text-white/80 text-[10px] md:text-xs mb-2 font-bold flex items-center gap-1.5"><Package className="w-3 h-3"/> 샐러드 패킹지시 (총 {totals.salads}개)</p>
                          <div className="flex gap-2 text-xs font-black">
                            {saladPacks.pack3 > 0 && <span className="bg-white text-[#EB5722] px-2.5 py-1 rounded shadow-sm">3인용 {saladPacks.pack3}개</span>}
                            {saladPacks.pack2 > 0 && <span className="bg-white text-[#EB5722] px-2.5 py-1 rounded shadow-sm">2인용 {saladPacks.pack2}개</span>}
                            {saladPacks.pack1 > 0 && <span className="bg-white text-[#EB5722] px-2.5 py-1 rounded shadow-sm">1인용 {saladPacks.pack1}개</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 md:pb-8 scrollbar-hide">
                  {clients.map(client => {
                    const isToday = client.payment === "당일결제";
                    return (
                      <div 
                        key={client.id}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] md:text-xs font-semibold bg-slate-100 text-slate-600 mb-2">
                              <Clock className="w-2.5 md:w-3 h-2.5 md:h-3" />
                              {client.time}
                            </span>
                            <h3 className="font-bold text-base md:text-lg leading-tight text-slate-900">{client.name}</h3>
                          </div>
                          {isToday && (
                            <span className="shrink-0 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                              오늘 수금
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2 md:gap-3 mb-4">
                          <div className="flex-1 bg-slate-50 rounded-xl p-2 md:p-2.5 text-center border border-slate-100">
                            <p className="text-[9px] md:text-[10px] text-slate-500 mb-0.5 font-bold">배송: 기본도시락</p>
                            <p className="text-xl md:text-2xl font-black text-slate-800">{client.lunchboxes}</p>
                          </div>
                          {client.salads > 0 && (
                            <div className="flex-1 bg-[#FFF5F0]/50 rounded-xl p-2 md:p-2.5 text-center border border-[#EB5722]/10">
                              <p className="text-[9px] md:text-[10px] text-[#EB5722]/70 mb-0.5 font-bold">배송: 샐러드</p>
                              <p className="text-xl md:text-2xl font-black text-[#EB5722]">{client.salads}</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 mb-0.5 whitespace-nowrap">오늘 수거할 용기</p>
                            <p className="text-lg md:text-xl font-black text-slate-700">{client.mockPreviousQty}개</p>
                          </div>
                          <button
                            onClick={() => toggleProperty(client.id, 'isCollected')}
                            className={`px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all w-24 md:w-28 shrink-0 ${
                              client.isCollected 
                                ? "bg-slate-200 text-slate-500 border border-slate-300" 
                                : "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                            }`}
                          >
                            {client.isCollected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                            {client.isCollected ? "완료" : "수거"}
                          </button>
                        </div>

                        {client.memo && (
                          <div className="bg-red-50 text-red-700 text-xs p-2 rounded-lg mb-4 font-bold flex items-center gap-1.5 border border-red-100">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {client.memo}
                          </div>
                        )}

                        {isToday && (
                          <div className="pt-2 border-t border-slate-100">
                            <button
                              onClick={() => toggleProperty(client.id, 'isPaid')}
                              className={`w-full py-3 md:py-3.5 rounded-xl text-xs md:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-sm ${
                                client.isPaid 
                                  ? "bg-green-100 text-green-700 border-2 border-green-500/20" 
                                  : "bg-[#EB5722] text-white hover:bg-[#EB5722]/90 shadow-[#EB5722]/30 active:scale-[0.98]"
                              }`}
                            >
                              <DollarSign className={`w-4 h-4 md:w-5 md:h-5 ${client.isPaid ? 'text-green-600' : 'text-white'}`} />
                              {client.isPaid ? "수금 내역 등록 취소" : "현장 수금 완료"}
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "transaction" && (
            <div className="animate-in fade-in flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 hidden md:block">💰 거래 및 수금 현황</h2>
                <button
                  onClick={exportExcel}
                  className="w-full sm:w-auto bg-white border rounded-xl px-4 py-3 sm:py-2 flex items-center justify-center gap-2 shadow-sm text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm md:text-base"
                >
                  <Download className="w-4 h-4 text-[#EB5722]" />
                  명세서 엑셀 다운로드
                </button>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 당일결제 */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-slate-900 mb-1">당일결제 수금 현황</h3>
                      <p className="text-[11px] md:text-xs text-slate-500 font-medium">오늘 현장 수금 액수 합계</p>
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-slate-500 mb-0.5">수금 완료액</p>
                      <p className="text-2xl md:text-3xl font-bold text-green-600">₩{transactionGroups['당일결제'].collectedAmount.toLocaleString()}</p>
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-[11px] md:text-xs font-semibold text-slate-400 mb-0.5">미수금 (수금 예정)</p>
                      <p className="text-lg md:text-xl font-bold text-slate-700">₩{transactionGroups['당일결제'].pendingAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* 주결제 */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border-t-4 border-t-blue-500 border-x border-b border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-slate-900 mb-1">주결제 정산</h3>
                      <p className="text-[11px] md:text-xs text-slate-500 font-medium">이번 주 정산 예정 금액</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-4">₩{transactionGroups['주결제'].totalAmount.toLocaleString()}</p>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 bg-slate-50 rounded-lg p-2 px-3">
                    <span>수량 총합 <strong className="text-slate-900">{transactionGroups['주결제'].lunchboxes + transactionGroups['주결제'].salads}</strong>개</span>
                  </div>
                </div>

                {/* 월결제 */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border-t-4 border-t-slate-500 border-x border-b border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-slate-900 mb-1">월결제 청구</h3>
                      <p className="text-[11px] md:text-xs text-slate-500 font-medium">월말 청구 예정 금액</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-4">₩{transactionGroups['월결제'].totalAmount.toLocaleString()}</p>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 bg-slate-50 rounded-lg p-2 px-3">
                     <span>수량 총합 <strong className="text-slate-900">{transactionGroups['월결제'].lunchboxes + transactionGroups['월결제'].salads}</strong>개</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-100">
                  <h3 className="text-base md:text-lg font-bold text-slate-900">결제 방식별 상세 내역</h3>
                </div>
                
                {['당일결제', '주결제', '월결제'].map(paymentType => {
                  const group = transactionGroups[paymentType];
                  if (group.items.length === 0) return null;
                  
                  const getGroupBgColor = (type: string) => {
                    switch(type) {
                      case '당일결제': return 'bg-red-50/50';
                      case '주결제': return 'bg-blue-50/50';
                      case '월결제': return 'bg-slate-50/50';
                      default: return '';
                    }
                  };

                  const getBadgeColor = (type: string) => {
                    switch(type) {
                      case '당일결제': return 'bg-red-100 text-red-700';
                      case '주결제': return 'bg-blue-100 text-blue-700';
                      case '월결제': return 'bg-slate-200 text-slate-700';
                      default: return '';
                    }
                  };

                  return (
                    <div key={paymentType} className="border-b border-slate-100 last:border-0">
                      <div className={`${getGroupBgColor(paymentType)} px-4 md:px-6 py-3 border-b border-slate-100 flex items-center justify-between`}>
                        <span className={`px-2 md:px-2.5 py-1 rounded-md text-[11px] md:text-xs font-bold ${getBadgeColor(paymentType)}`}>
                          {paymentType} ({group.items.length}곳)
                        </span>
                        <span className="text-xs md:text-sm font-bold text-slate-800">
                          그룹 소계 : ₩{group.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <tbody className="divide-y divide-slate-50">
                            {group.items.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 md:px-6 py-4 font-semibold text-slate-900 w-1/4 text-sm md:text-base">
                                  {item.name}
                                </td>
                                <td className="px-4 md:px-6 py-4 w-1/5">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs md:text-sm font-medium text-slate-700">총 {item.qty}개</span>
                                    <span className="text-[10px] md:text-xs text-slate-400 font-bold">도 {item.lunchboxes} / 샐 {item.salads}</span>
                                  </div>
                                </td>
                                <td className="px-4 md:px-6 py-4 text-xs md:text-sm font-bold text-slate-500 w-1/5">
                                  ₩{item.priceNum.toLocaleString()}
                                </td>
                                <td className="px-4 md:px-6 py-4 font-bold text-slate-900 w-1/5 text-sm md:text-base">
                                  ₩{item.amount.toLocaleString()}
                                </td>
                                <td className="px-4 md:px-6 py-4 w-1/5 text-right">
                                  {item.payment === '당일결제' ? (
                                    item.isPaid ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 md:gap-1.5 md:px-3 md:py-1.5 rounded-lg border border-green-200 bg-green-50 text-[10px] md:text-xs font-bold text-green-700">
                                        <CheckCircle className="w-3 md:w-4 h-3 md:h-4" /> 수금완료
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 md:gap-1.5 md:px-3 md:py-1.5 rounded-lg border border-red-200 bg-red-50 text-[10px] md:text-xs font-bold text-red-600">
                                        미수금
                                      </span>
                                    )
                                  ) : (
                                    <button className="inline-flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-slate-200 text-[10px] md:text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                                      <FileText className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                      명세서
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="animate-in fade-in flex flex-col items-center justify-center py-20 md:py-32 text-center px-4">
              <div className="w-16 h-16 bg-[#FFF5F0] rounded-2xl flex items-center justify-center mb-6 text-[#EB5722]">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">고객 피드백 & 맛 평가</h2>
              <p className="text-sm md:text-base text-slate-500 max-w-md">이번 스프린트에서는 피드백 뷰가 디자인 단계입니다. 다음 단계에서 카카오톡 및 QR코드 기반 피드백 집계 기능이 추가됩니다.</p>
            </div>
          )}

        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        <button onClick={() => setActiveTab('admin')} className={`flex-1 p-3 pt-4 pb-4 flex flex-col items-center gap-1.5 ${activeTab === 'admin' ? 'text-[#EB5722]' : 'text-slate-400'}`}>
          <Package className={`w-5 h-5 ${activeTab === 'admin' ? 'fill-[#EB5722]/10' : ''}`} />
          <span className="text-[10px] font-bold">주문 현황</span>
        </button>
        <button onClick={() => setActiveTab('driver')} className={`flex-1 p-3 pt-4 pb-4 flex flex-col items-center gap-1.5 ${activeTab === 'driver' ? 'text-[#EB5722]' : 'text-slate-400'}`}>
          <Truck className={`w-5 h-5 ${activeTab === 'driver' ? 'fill-[#EB5722]/10' : ''}`} />
          <span className="text-[10px] font-bold">배달원</span>
        </button>
        <button onClick={() => setActiveTab('transaction')} className={`flex-1 p-3 pt-4 pb-4 flex flex-col items-center gap-1.5 ${activeTab === 'transaction' ? 'text-[#EB5722]' : 'text-slate-400'}`}>
          <DollarSign className={`w-5 h-5 ${activeTab === 'transaction' ? 'fill-[#EB5722]/10' : ''}`} />
          <span className="text-[10px] font-bold">거래 대장</span>
        </button>
        <button onClick={() => setActiveTab('feedback')} className={`flex-1 p-3 pt-4 pb-4 flex flex-col items-center gap-1.5 ${activeTab === 'feedback' ? 'text-[#EB5722]' : 'text-slate-400'}`}>
          <MessageSquare className={`w-5 h-5 ${activeTab === 'feedback' ? 'fill-[#EB5722]/10' : ''}`} />
          <span className="text-[10px] font-bold">피드백</span>
        </button>
      </nav>

    </div>
  );
}
