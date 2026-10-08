// Supabase 프로젝트 주소와 Publishable(또는 anon) 키를 직접 입력하세요.
// service_role 또는 secret 키는 브라우저 코드에 절대로 넣으면 안 됩니다.
const SUPABASE_URL = "https://enldtjrsmjppkckxdzel.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVubGR0anJzbWpwcGtja3hkemVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTc4NjEsImV4cCI6MjA5NTM5Mzg2MX0.m_4CVASBl7F8CykSykRDQWB6b4wYIMoKGrlM134jQYc";

// CDN으로 불러온 supabase-js v2로 데이터베이스 연결 객체를 만듭니다.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// HTML 요소를 id로 찾아 변수에 저장합니다.
const orderForm = document.getElementById("order-form");
const customerName = document.getElementById("customer-name");
const phoneNumber = document.getElementById("phone-number");
const drink = document.getElementById("drink");
const quantity = document.getElementById("quantity");
const estimatedPrice = document.getElementById("estimated-price");
const orderMessage = document.getElementById("order-message");
const orderTab = document.getElementById("order-tab");
const historyTab = document.getElementById("history-tab");
const orderPanel = document.getElementById("order-panel");
const historyPanel = document.getElementById("history-panel");
const orderCount = document.getElementById("order-count");
const orderList = document.getElementById("order-list");
const orderSummary = document.getElementById("order-summary");
const printReceiptButton = document.getElementById("print-receipt");
const clearOrdersButton = document.getElementById("clear-orders");
const submitButton = orderForm.querySelector('button[type="submit"]');

// 접수된 주문을 저장합니다. 새 주문은 배열의 맨 앞에 넣습니다.
const orders = [];
let nextOrderNumber = 1;

// 선택한 음료, 사이즈, 옵션, 수량으로 최종 금액을 계산합니다.
function calculateTotal() {
  const drinkPrice = Number(drink.selectedOptions[0].dataset.price);
  const selectedSize = document.querySelector('input[name="size"]:checked');
  const sizePrice = Number(selectedSize.dataset.price);
  let optionPrice = 0;

  document.querySelectorAll('input[name="options"]:checked').forEach((option) => {
    optionPrice += Number(option.dataset.price);
  });

  const orderQuantity = Number(quantity.value) || 1;
  // 음료를 고르기 전에는 사이즈와 옵션 가격을 더하지 않습니다.
  return drink.value === "" ? 0 : (drinkPrice + sizePrice + optionPrice) * orderQuantity;
}

// 계산한 금액을 주문서에 천 단위 콤마와 함께 보여 줍니다.
function updateEstimatedPrice() {
  estimatedPrice.textContent = `예상 금액: ${calculateTotal().toLocaleString()}원`;
}

// 주문 배열을 바탕으로 주문 내역 화면을 처음부터 다시 그립니다.
function renderOrders() {
  // 사용자 입력을 안전하게 표시하기 위해 innerHTML 대신 textContent를 사용합니다.
  orderList.textContent = "";
  orderCount.textContent = orders.length;

  if (orders.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-orders";
    emptyMessage.textContent = "아직 주문 내역이 없어요 ☕";
    orderList.append(emptyMessage);
    orderSummary.classList.add("hidden");
    clearOrdersButton.classList.add("hidden");
    return;
  }

  let totalAmount = 0;

  orders.forEach((order) => {
    totalAmount += order.total;
    const card = document.createElement("article");
    card.className = "order-item";

    const title = document.createElement("p");
    title.className = "order-title";
    title.textContent = `#${order.number} ${order.name}님 · ${order.total.toLocaleString()}원`;

    const detail = document.createElement("p");
    detail.className = "order-detail";
    const optionText = order.options.length > 0 ? ` (${order.options.join(", ")})` : "";
    detail.textContent = `${order.drinkName} ${order.size}사이즈${optionText} ${order.quantity}잔`;

    const meta = document.createElement("p");
    meta.className = "order-meta";
    meta.textContent = order.request ? `요청사항: ${order.request} · ${order.time}` : order.time;

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "cancel-order";
    cancelButton.textContent = "취소";
    cancelButton.addEventListener("click", () => {
      if (confirm(`#${order.number} 주문을 취소할까요?`)) {
        const index = orders.findIndex((item) => item.number === order.number);
        orders.splice(index, 1);
        renderOrders();
      }
    });

    card.append(title, detail, meta, cancelButton);
    orderList.append(card);
  });

  orderSummary.textContent = `총 주문 금액: ${totalAmount.toLocaleString()}원 (${orders.length}건)`;
  orderSummary.classList.remove("hidden");
  clearOrdersButton.classList.remove("hidden");
}

// 탭을 클릭했을 때 선택된 내용만 보이도록 처리합니다.
function showTab(tabName) {
  const isOrderTab = tabName === "order";
  orderTab.classList.toggle("active", isOrderTab);
  historyTab.classList.toggle("active", !isOrderTab);
  orderTab.setAttribute("aria-selected", isOrderTab);
  historyTab.setAttribute("aria-selected", !isOrderTab);
  orderPanel.classList.toggle("hidden", !isOrderTab);
  historyPanel.classList.toggle("hidden", isOrderTab);
}

// 음료, 사이즈, 옵션, 수량이 바뀌면 예상 금액도 갱신합니다.
drink.addEventListener("change", updateEstimatedPrice);
document.querySelectorAll('input[name="size"]').forEach((size) => size.addEventListener("change", updateEstimatedPrice));
document.querySelectorAll('input[name="options"]').forEach((option) => option.addEventListener("change", updateEstimatedPrice));
quantity.addEventListener("input", updateEstimatedPrice);
quantity.addEventListener("change", updateEstimatedPrice);

orderTab.addEventListener("click", () => showTab("order"));
historyTab.addEventListener("click", () => showTab("history"));

// 주문서를 제출하면 필수 항목을 확인하고 주문 정보를 저장합니다.
orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (customerName.value.trim() === "") {
    alert("이름을 입력해주세요");
    customerName.focus();
    return;
  }
  if (drink.value === "") {
    alert("음료를 선택해주세요");
    drink.focus();
    return;
  }
  if (phoneNumber.value.trim() === "") {
    alert("전화번호를 입력해주세요");
    phoneNumber.focus();
    return;
  }

  const selectedSize = document.querySelector('input[name="size"]:checked');
  const optionNames = Array.from(document.querySelectorAll('input[name="options"]:checked'), (option) => {
    return option.nextElementSibling.textContent.split(" +")[0];
  });
  const newOrder = {
    number: nextOrderNumber,
    name: customerName.value.trim(),
    drinkName: drink.selectedOptions[0].textContent.split(" ")[0],
    size: selectedSize.value,
    options: optionNames,
    quantity: Number(quantity.value) || 1,
    request: document.getElementById("request").value.trim(),
    total: calculateTotal(),
    time: new Date().toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }),
  };

  // 저장 중에는 버튼을 잠시 막아 같은 주문이 두 번 저장되지 않게 합니다.
  submitButton.disabled = true;
  submitButton.textContent = "저장 중...";

  try {
    // 화면에서 만든 주문 정보를 Supabase orders 테이블의 열 이름에 맞춰 저장합니다.
    const { error } = await supabaseClient.from("orders").insert({
      customer_name: newOrder.name,
      phone: phoneNumber.value.trim(),
      drink: newOrder.drinkName,
      drink_price: Number(drink.selectedOptions[0].dataset.price),
      size: newOrder.size,
      options: newOrder.options,
      quantity: newOrder.quantity,
      request: newOrder.request || null,
      total_price: newOrder.total,
    });

    // Supabase가 알려 준 오류는 catch로 넘겨 실패 처리를 한 곳에서 합니다.
    if (error) {
      throw error;
    }

    // 데이터베이스 저장이 성공한 주문만 화면의 주문 내역에 추가합니다.
    nextOrderNumber += 1;
    orders.unshift(newOrder);
    renderOrders();

    // 기존 주문 확인 메시지는 저장 성공 시에만 보여 줍니다.
    const optionText = optionNames.length > 0 ? ` (${optionNames.join(", ")})` : "";
    orderMessage.textContent = `${newOrder.name}님, ${newOrder.drinkName} ${newOrder.size}사이즈${optionText} ${newOrder.quantity}잔, 총 ${newOrder.total.toLocaleString()}원 주문이 접수되었습니다!`;
    orderMessage.classList.remove("hidden");
  } catch (error) {
    // 저장 실패 원인은 개발자 도구 콘솔에서 자세히 확인할 수 있습니다.
    console.error("Supabase 주문 저장 오류:", error);
    alert("주문 저장에 실패했어요");
  } finally {
    // 성공 또는 실패와 관계없이 버튼을 다시 누를 수 있게 원래 상태로 돌립니다.
    submitButton.disabled = false;
    submitButton.textContent = "주문하기";
  }
});

// 다시 작성은 주문서만 초기화하며 저장한 주문 내역은 그대로 둡니다.
orderForm.addEventListener("reset", () => {
  setTimeout(() => {
    document.getElementById("size-m").checked = true;
    quantity.value = 1;
    orderMessage.textContent = "";
    orderMessage.classList.add("hidden");
    updateEstimatedPrice();
  }, 0);
});

// 전체 삭제도 확인 창에서 승인했을 때만 실행합니다.
clearOrdersButton.addEventListener("click", () => {
  if (confirm("주문 내역을 모두 지울까요?")) {
    orders.length = 0;
    renderOrders();
  }
});

// 브라우저의 인쇄 창을 열어 현재 주문 내역을 영수증처럼 인쇄합니다.
printReceiptButton.addEventListener("click", () => {
  if (orders.length === 0) {
    alert("인쇄할 주문 내역이 없어요.");
    return;
  }

  window.print();
});

// 페이지를 처음 열었을 때 기본 화면을 설정합니다.
updateEstimatedPrice();
renderOrders();
