const STORAGE_KEY = "moscow-utility-calculator-v1";
const MAX_OBJECTS = 10;

const SERVICE_LABELS = {
  electricity_day: "Электроэнергия, день",
  electricity_peak: "Электроэнергия, пик",
  electricity_night: "Электроэнергия, ночь",
  electricity_half_peak: "Электроэнергия, полупик",
  electricity_mop_peak: "Электроэнергия МОП, пик",
  electricity_mop_night: "Электроэнергия МОП, ночь",
  electricity_mop_half_peak: "Электроэнергия МОП, полупик",
  cold_water: "Холодная вода",
  hot_water: "Горячая вода",
  hot_water_heat: "ГВС: подогрев",
  hot_water_cold: "ГВС: ХВ для ГВ",
  sewerage: "Водоотведение",
  heating: "Отопление",
  gas: "Газ",
  housing_maintenance: "Содержание помещения",
  territory_maintenance: "Содержание территории",
  construction_waste: "Вывоз строительного мусора",
  membership: "Членские взносы",
};

const READING_KEYS = {
  electricity_day: "electricityDay",
  electricity_peak: "electricityPeak",
  electricity_night: "electricityNight",
  electricity_half_peak: "electricityHalfPeak",
  cold_water: "coldWater",
  hot_water: "hotWater",
  gas: "gas",
};

const UNIT_LABELS = {
  per_unit: "за единицу",
  fixed: "фикс.",
  per_m2: "за м²",
};

const SERVICE_GROUPS = {
  electricity: {
    title: "Электроэнергия",
    hint: "Загрузите счет Мосэнергосбыта или другого поставщика. Поддерживаются пик, ночь и полупик.",
    services: [
      "electricity_day",
      "electricity_peak",
      "electricity_night",
      "electricity_half_peak",
      "electricity_mop_peak",
      "electricity_mop_night",
      "electricity_mop_half_peak",
    ],
  },
  water: {
    title: "Вода",
    hint: "Можно загрузить одну или несколько квитанций УК: ХВС, ГВС, подогрев и водоотведение соберутся вместе.",
    services: ["cold_water", "hot_water", "hot_water_heat", "hot_water_cold", "sewerage"],
  },
  gas: {
    title: "Газ",
    hint: "Загрузите счет поставщика газа или добавьте тариф вручную, если PDF пока не распознается.",
    services: ["gas"],
  },
};

const DEFAULT_SETTINGS = {
  reminderDay: 20,
  remindersEnabled: true,
  browserNotifications: false,
  dismissedReminderMonth: "",
  lastNotificationKey: "",
};

const MONTHS = {
  январь: "01",
  января: "01",
  февраль: "02",
  февраля: "02",
  март: "03",
  марта: "03",
  апрель: "04",
  апреля: "04",
  май: "05",
  мая: "05",
  июнь: "06",
  июня: "06",
  июль: "07",
  июля: "07",
  август: "08",
  августа: "08",
  сентябрь: "09",
  сентября: "09",
  октябрь: "10",
  октября: "10",
  ноябрь: "11",
  ноября: "11",
  декабрь: "12",
  декабря: "12",
};

const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
});

const number = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 4,
});

let state = loadState();
let selectedObjectId = state.objects[0]?.id ?? null;
let editingTariffId = null;
let editingReadingId = null;

const $ = (id) => document.getElementById(id);

const elements = {
  objectCount: $("objectCount"),
  objectList: $("objectList"),
  emptyState: $("emptyState"),
  objectView: $("objectView"),
  summaryPanel: $("summaryPanel"),
  summaryTitle: $("summaryTitle"),
  summaryAddress: $("summaryAddress"),
  summaryTotal: $("summaryTotal"),
  summaryAccount: $("summaryAccount"),
  summaryCompany: $("summaryCompany"),
  summaryArea: $("summaryArea"),
  summaryServices: $("summaryServices"),
  objectForm: $("objectForm"),
  objectName: $("objectName"),
  objectRegion: $("objectRegion"),
  objectCompany: $("objectCompany"),
  objectAccount: $("objectAccount"),
  objectAddress: $("objectAddress"),
  objectArea: $("objectArea"),
  reminderSummary: $("reminderSummary"),
  reminderDueList: $("reminderDueList"),
  reminderDay: $("reminderDay"),
  reminderEnabled: $("reminderEnabled"),
  notificationBtn: $("notificationBtn"),
  dismissReminderBtn: $("dismissReminderBtn"),
  calcMonth: $("calcMonth"),
  calculationResult: $("calculationResult"),
  serviceStatus: $("serviceStatus"),
  serviceCards: $("serviceCards"),
  receiptInput: $("receiptInput"),
  receiptStatus: $("receiptStatus"),
  receiptList: $("receiptList"),
  tariffPdfInput: $("tariffPdfInput"),
  tariffStatus: $("tariffStatus"),
  tariffList: $("tariffList"),
  readingList: $("readingList"),
  objectDialog: $("objectDialog"),
  newObjectForm: $("newObjectForm"),
  newObjectName: $("newObjectName"),
  newObjectRegion: $("newObjectRegion"),
  newObjectCompany: $("newObjectCompany"),
  newObjectAccount: $("newObjectAccount"),
  newObjectAddress: $("newObjectAddress"),
  newObjectArea: $("newObjectArea"),
  tariffDialog: $("tariffDialog"),
  tariffForm: $("tariffForm"),
  tariffService: $("tariffService"),
  tariffRate: $("tariffRate"),
  tariffUnit: $("tariffUnit"),
  tariffFrom: $("tariffFrom"),
  tariffTo: $("tariffTo"),
  tariffNote: $("tariffNote"),
  readingDialog: $("readingDialog"),
  readingForm: $("readingForm"),
  readingMonth: $("readingMonth"),
  readingElectricityDay: $("readingElectricityDay"),
  readingElectricityPeak: $("readingElectricityPeak"),
  readingElectricityNight: $("readingElectricityNight"),
  readingElectricityHalfPeak: $("readingElectricityHalfPeak"),
  readingColdWater: $("readingColdWater"),
  readingHotWater: $("readingHotWater"),
  readingGas: $("readingGas"),
  importInput: $("importInput"),
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.objects)) {
      return {
        objects: saved.objects.map(normalizeObject),
        settings: normalizeSettings(saved.settings),
      };
    }
  } catch {
    // Ignore broken saved data and start clean.
  }

  return {
    objects: [],
    settings: normalizeSettings(),
  };
}

function normalizeSettings(settings = {}) {
  const reminderDay = Math.min(28, Math.max(1, toNumber(settings.reminderDay) || DEFAULT_SETTINGS.reminderDay));
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    reminderDay,
    remindersEnabled: settings.remindersEnabled ?? DEFAULT_SETTINGS.remindersEnabled,
  };
}

function normalizeObject(object) {
  return {
    id: object.id ?? uid("object"),
    name: object.name ?? "Без названия",
    region: object.region ?? "Москва",
    company: object.company ?? "",
    account: object.account ?? "",
    address: object.address ?? "",
    area: object.area ?? 0,
    tariffs: Array.isArray(object.tariffs) ? object.tariffs : [],
    readings: Array.isArray(object.readings) ? object.readings : [],
    receipts: Array.isArray(object.receipts) ? object.receipts : [],
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function selectedObject() {
  return state.objects.find((object) => object.id === selectedObjectId) ?? null;
}

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function currentDayOfMonth() {
  return new Date().getDate();
}

function nextReminderDate() {
  const now = new Date();
  const day = state.settings.reminderDay;
  const date = new Date(now.getFullYear(), now.getMonth(), day);
  if (now.getDate() > day) {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function monthStart(month) {
  return `${month}-01`;
}

function previousMonth(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "без окончания";
  return value.split("-").reverse().join(".");
}

function toNumber(value) {
  if (typeof value === "string") {
    value = value.replace(/\s/g, "").replace(",", ".");
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function render() {
  renderObjects();
  renderSelectedObject();
  saveState();
}

function renderObjects() {
  elements.objectCount.textContent = `${state.objects.length} / ${MAX_OBJECTS}`;
  elements.objectList.innerHTML = "";

  state.objects.forEach((object) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `object-card${object.id === selectedObjectId ? " active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(object.name)}</strong>
      <span>${escapeHtml(object.address || object.region)} · ${escapeHtml(object.company || "УК не указана")}</span>
    `;
    button.addEventListener("click", () => {
      selectedObjectId = object.id;
      render();
    });
    elements.objectList.append(button);
  });
}

function renderSelectedObject() {
  const object = selectedObject();
  elements.emptyState.classList.toggle("hidden", Boolean(object));
  elements.objectView.classList.toggle("hidden", !object);
  elements.summaryPanel.classList.toggle("hidden", !object);

  if (!object) return;

  elements.objectName.value = object.name;
  elements.objectRegion.value = object.region;
  elements.objectCompany.value = object.company ?? "";
  elements.objectAccount.value = object.account ?? "";
  elements.objectAddress.value = object.address ?? "";
  elements.objectArea.value = object.area ?? "";
  elements.calcMonth.value = elements.calcMonth.value || currentMonth();

  renderReminders();
  renderServiceSections(object);
  renderTariffs(object);
  renderReadings(object);
  renderReceipts(object);
  renderCalculation(object);
  renderSummary(object);
}

function renderTariffs(object) {
  const rows = [...object.tariffs].sort((a, b) => {
    const aLabel = SERVICE_LABELS[a.service] ?? a.service;
    const bLabel = SERVICE_LABELS[b.service] ?? b.service;
    const byService = aLabel.localeCompare(bLabel, "ru");
    return byService || a.from.localeCompare(b.from);
  });

  if (!rows.length) {
    elements.tariffList.innerHTML = `<div class="result-card">Тарифы пока не добавлены.</div>`;
    return;
  }

  elements.tariffList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Услуга</th>
          <th>Тариф</th>
          <th>Единица</th>
          <th>Период</th>
          <th>Комментарий</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (tariff) => {
              const serviceLabel = SERVICE_LABELS[tariff.service] ?? tariff.service;
              const unitLabel = UNIT_LABELS[tariff.unit] ?? tariff.unit;
              return `
              <tr>
                <td>${escapeHtml(serviceLabel)}</td>
                <td>${number.format(tariff.rate)} руб.</td>
                <td>${escapeHtml(unitLabel)}</td>
                <td>${formatDate(tariff.from)} - ${formatDate(tariff.to)}</td>
                <td>${escapeHtml(tariff.note ?? "")}</td>
                <td>
                  <button class="link-button" data-edit-tariff="${tariff.id}" type="button">Изм.</button>
                  <button class="link-button" data-delete-tariff="${tariff.id}" type="button">Удал.</button>
                </td>
              </tr>
            `;
            },
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderReadings(object) {
  const rows = [...object.readings].sort((a, b) => a.month.localeCompare(b.month));

  if (!rows.length) {
    elements.readingList.innerHTML = `<div class="result-card">Показания пока не добавлены.</div>`;
    return;
  }

  elements.readingList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Месяц</th>
          <th>Свет день</th>
          <th>Свет пик</th>
          <th>Свет ночь</th>
          <th>Свет полупик</th>
          <th>ХВС</th>
          <th>ГВС</th>
          <th>Газ</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (reading) => `
              <tr>
                <td>${reading.month}</td>
                <td>${number.format(reading.electricityDay ?? 0)}</td>
                <td>${number.format(reading.electricityPeak ?? 0)}</td>
                <td>${number.format(reading.electricityNight ?? 0)}</td>
                <td>${number.format(reading.electricityHalfPeak ?? 0)}</td>
                <td>${number.format(reading.coldWater ?? 0)}</td>
                <td>${number.format(reading.hotWater ?? 0)}</td>
                <td>${number.format(reading.gas ?? 0)}</td>
                <td>
                  <button class="link-button" data-edit-reading="${reading.id}" type="button">Изм.</button>
                  <button class="link-button" data-delete-reading="${reading.id}" type="button">Удал.</button>
                </td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderReceipts(object) {
  const receipts = [...(object.receipts ?? [])].sort((a, b) => {
    return `${b.month ?? ""}${b.importedAt ?? ""}`.localeCompare(`${a.month ?? ""}${a.importedAt ?? ""}`);
  });

  if (!receipts.length) {
    elements.receiptList.innerHTML = `<div class="result-card">Квитанции пока не загружены.</div>`;
    return;
  }

  elements.receiptList.innerHTML = receipts
    .map(
      (receipt) => `
        <article class="panel receipt-card">
          <div class="receipt-summary">
            <div>
              <span class="badge">${escapeHtml(receipt.providerType)}</span>
              ${receipt.category ? `<span class="badge">${escapeHtml(SERVICE_GROUPS[receipt.category]?.title ?? receipt.category)}</span>` : ""}
              <h3>${escapeHtml(receipt.provider)}</h3>
              <div class="receipt-meta">
                ${escapeHtml(receipt.month ?? "месяц не определен")}
                · ${escapeHtml(receipt.fileName)}
                ${receipt.account ? ` · ЛС ${escapeHtml(receipt.account)}` : ""}
              </div>
              ${receipt.address ? `<div class="receipt-meta">${escapeHtml(receipt.address)}</div>` : ""}
            </div>
            <div>
              <div class="receipt-total">${rub.format(receipt.totalDue ?? 0)}</div>
              <div class="receipt-meta">к оплате</div>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Строка</th>
                  <th>Объем</th>
                  <th>Ед.</th>
                  <th>Тариф</th>
                  <th>Начислено</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${(receipt.items ?? [])
                  .map(
                    (item) => `
                      <tr>
                        <td>${escapeHtml(item.name)}</td>
                        <td>${item.volume === null ? "" : number.format(item.volume ?? 0)}</td>
                        <td>${escapeHtml(item.unit ?? "")}</td>
                        <td>${item.rate === null ? "" : number.format(item.rate ?? 0)}</td>
                        <td>${rub.format(item.amount ?? 0)}</td>
                        <td><button class="link-button" data-delete-receipt="${receipt.id}" type="button">Удал.</button></td>
                      </tr>
                    `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderServiceSections(object) {
  elements.serviceCards.innerHTML = Object.entries(SERVICE_GROUPS)
    .map(([category, group]) => {
      const tariffs = (object.tariffs ?? []).filter((tariff) => serviceCategoryFor(tariff.service) === category);
      const receipts = (object.receipts ?? []).filter((receipt) => receipt.category === category);
      const tariffLines = tariffs.length
        ? tariffs
            .slice(0, 5)
            .map((tariff) => {
              const label = SERVICE_LABELS[tariff.service] ?? tariff.service;
              return `<div><strong>${escapeHtml(label)}</strong>: ${number.format(tariff.rate)} руб. с ${formatDate(tariff.from)}</div>`;
            })
            .join("")
        : "<div>Тарифы пока не загружены.</div>";
      const receiptLines = receipts.length
        ? receipts
            .slice(0, 3)
            .map((receipt) => `<div>${escapeHtml(receipt.month)} · ${escapeHtml(receipt.fileName)}</div>`)
            .join("")
        : "<div>Документов пока нет.</div>";

      return `
        <article class="panel service-card">
          <div>
            <span class="badge">${tariffs.length} тарифов</span>
            <h3>${group.title}</h3>
            <p>${group.hint}</p>
          </div>
          <label class="primary file-button">
            Загрузить документ
            <input type="file" accept="application/pdf" data-service-upload="${category}" />
          </label>
          <div class="service-list">
            <strong>Тарифы</strong>
            ${tariffLines}
          </div>
          <div class="service-list">
            <strong>Документы</strong>
            ${receiptLines}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderReminders() {
  const settings = state.settings;
  const status = getReminderStatus();

  elements.reminderDay.value = settings.reminderDay;
  elements.reminderEnabled.checked = settings.remindersEnabled;
  elements.notificationBtn.textContent =
    settings.browserNotifications && window.Notification?.permission === "granted" ? "Уведомления включены" : "Уведомления";
  elements.dismissReminderBtn.classList.toggle("hidden", !status.isDue || !status.missingObjects.length);

  if (!settings.remindersEnabled) {
    elements.reminderSummary.textContent = "Напоминания выключены.";
    elements.reminderDueList.innerHTML = "";
    return;
  }

  if (!status.isDue) {
    elements.reminderSummary.textContent = `Следующее напоминание: ${nextReminderDate()}.`;
    elements.reminderDueList.innerHTML = "";
    return;
  }

  if (settings.dismissedReminderMonth === status.month) {
    elements.reminderSummary.textContent = `Напоминание за ${status.month} скрыто.`;
    elements.reminderDueList.innerHTML = "";
    return;
  }

  if (!status.missingObjects.length) {
    elements.reminderSummary.textContent = `За ${status.month} все объекты уже закрыты показаниями или квитанциями.`;
    elements.reminderDueList.innerHTML = "";
    return;
  }

  elements.reminderSummary.textContent = `Пора внести показания или загрузить квитанции за ${status.month}.`;
  elements.reminderDueList.innerHTML = status.missingObjects
    .map((object) => `<span class="badge">${escapeHtml(object.name)}</span>`)
    .join("");

  maybeSendBrowserReminder(status);
}

function getReminderStatus() {
  const month = currentMonth();
  const isDue = currentDayOfMonth() >= state.settings.reminderDay;
  const missingObjects = state.objects.filter((object) => !objectHasMonthData(object, month));

  return {
    month,
    isDue,
    missingObjects,
  };
}

function objectHasMonthData(object, month) {
  const hasReading = (object.readings ?? []).some((reading) => reading.month === month);
  const hasReceipt = (object.receipts ?? []).some((receipt) => receipt.month === month);
  return hasReading || hasReceipt;
}

function maybeSendBrowserReminder(status) {
  if (!state.settings.browserNotifications || window.Notification?.permission !== "granted") return;
  if (!status.isDue || !status.missingObjects.length) return;
  if (state.settings.dismissedReminderMonth === status.month) return;

  const key = `${status.month}:${state.settings.reminderDay}:${status.missingObjects.map((object) => object.id).join(",")}`;
  if (state.settings.lastNotificationKey === key) return;

  new Notification("Пора внести ЖКХ", {
    body: `За ${status.month}: ${status.missingObjects.map((object) => object.name).join(", ")}`,
  });
  state.settings.lastNotificationKey = key;
  saveState();
}

function renderCalculation(object) {
  const month = elements.calcMonth.value || currentMonth();
  const result = calculateObject(object, month);
  const serviceCards = result.items
    .map(
      (item) => `
        <article class="result-card">
          <strong>${item.label}</strong>
          <div class="amount">${rub.format(item.amount)}</div>
          <div class="meta">${item.description}</div>
        </article>
      `,
    )
    .join("");

  const warnings = result.warnings.length
    ? `<article class="result-card warning"><strong>Что проверить</strong>${result.warnings
        .map((warning) => `<div class="meta">${warning}</div>`)
        .join("")}</article>`
    : "";

  elements.calculationResult.innerHTML = `
    <article class="result-card total">
      <strong>Итого за ${month}</strong>
      <div class="amount">${rub.format(result.total)}</div>
      <div class="meta">${object.name} · ${object.company || "УК не указана"}</div>
    </article>
    ${serviceCards}
    ${warnings}
  `;

  renderSummary(object, result);
}

function renderSummary(object, calculation = null) {
  const month = elements.calcMonth.value || currentMonth();
  const result = calculation ?? calculateObject(object, month);
  elements.summaryTitle.textContent = object.name || "Объект";
  elements.summaryAddress.textContent = object.address || object.region || "Адрес не указан";
  elements.summaryTotal.textContent = rub.format(result.total);
  elements.summaryAccount.textContent = object.account || "не указан";
  elements.summaryCompany.textContent = object.company || "не указана";
  elements.summaryArea.textContent = `${number.format(object.area || 0)} м²`;

  elements.summaryServices.innerHTML = Object.entries(SERVICE_GROUPS)
    .map(([category, group]) => {
      const tariffs = (object.tariffs ?? []).filter((tariff) => serviceCategoryFor(tariff.service) === category).length;
      const receipts = (object.receipts ?? []).filter((receipt) => receipt.category === category).length;
      return `
        <div class="summary-service">
          <strong>${group.title}</strong>
          <span>${tariffs} тарифов · ${receipts} документов</span>
        </div>
      `;
    })
    .join("");
}

function calculateObject(object, month) {
  const reading = object.readings.find((item) => item.month === month);
  const prevReading = object.readings.find((item) => item.month === previousMonth(month));
  const items = [];
  const warnings = [];

  if (!reading) {
    warnings.push("Нет показаний за выбранный месяц.");
  }

  const addMeterService = (service, readingKey) => {
    const tariff = activeTariff(object.tariffs, service, month);
    const current = reading?.[readingKey];
    const previous = prevReading?.[readingKey];
    const consumption = Math.max(0, toNumber(current) - toNumber(previous));

    if (!tariff) {
      if (current !== undefined && current !== null && current !== "" && toNumber(current) > 0) {
        warnings.push(`Нет тарифа: ${SERVICE_LABELS[service]}.`);
      }
      return;
    }

    if (current === undefined || current === null || current === "") {
      warnings.push(`Нет показания: ${SERVICE_LABELS[service]}.`);
    }

    if (!prevReading) {
      warnings.push("Нет показаний за предыдущий месяц, расход считается от нуля.");
    }

    items.push({
      label: SERVICE_LABELS[service],
      amount: consumption * tariff.rate,
      description: `${number.format(consumption)} × ${number.format(tariff.rate)} руб. (${formatDate(tariff.from)})`,
    });
  };

  addMeterService("electricity_day", "electricityDay");
  addMeterService("electricity_peak", "electricityPeak");
  addMeterService("electricity_night", "electricityNight");
  addMeterService("electricity_half_peak", "electricityHalfPeak");
  addMeterService("cold_water", "coldWater");
  addMeterService("hot_water", "hotWater");
  addMeterService("gas", "gas");

  const sewerageTariff = activeTariff(object.tariffs, "sewerage", month);
  if (sewerageTariff) {
    const cold = Math.max(0, toNumber(reading?.coldWater) - toNumber(prevReading?.coldWater));
    const hot = Math.max(0, toNumber(reading?.hotWater) - toNumber(prevReading?.hotWater));
    items.push({
      label: SERVICE_LABELS.sewerage,
      amount: (cold + hot) * sewerageTariff.rate,
      description: `${number.format(cold + hot)} × ${number.format(sewerageTariff.rate)} руб.`,
    });
  }

  const membershipTariff = activeTariff(object.tariffs, "membership", month);
  if (membershipTariff) {
    const base =
      membershipTariff.unit === "per_m2" ? toNumber(object.area) : membershipTariff.unit === "fixed" ? 1 : 1;
    items.push({
      label: SERVICE_LABELS.membership,
      amount: base * membershipTariff.rate,
      description:
        membershipTariff.unit === "per_m2"
          ? `${number.format(base)} м² × ${number.format(membershipTariff.rate)} руб.`
          : `${number.format(membershipTariff.rate)} руб. в месяц`,
    });
  }

  return {
    items,
    warnings,
    total: items.reduce((sum, item) => sum + item.amount, 0),
  };
}

function activeTariff(tariffs, service, month) {
  const date = monthStart(month);
  return tariffs
    .filter((tariff) => tariff.service === service && tariff.from <= date && (!tariff.to || tariff.to >= date))
    .sort((a, b) => b.from.localeCompare(a.from))[0];
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF.js не загрузился. Проверьте интернет-соединение или откройте страницу через опубликованный сайт.");
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const data = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join("\n"));
  }

  return pages.join("\n");
}

function parseReceipt(text, fileName) {
  const normalized = normalizeReceiptText(text);

  if (/СЧ[ЕЁ]Т ЗА ЭЛЕКТРОЭНЕРГИЮ|Начислено за электроэнергию/i.test(normalized)) {
    return parseElectricityReceipt(normalized, fileName);
  }

  if (/ПИК-КОМФОРТ|Единого платежного документа|ЖИЛИЩНО-КОММУНАЛЬНЫЕ/i.test(normalized)) {
    return parsePikReceipt(normalized, fileName);
  }

  return parseGenericReceipt(normalized, fileName);
}

function normalizeReceiptText(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/C\s+одержание/g, "Содержание")
    .trim();
}

function compactText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function extractReceiptMonth(text, fileName) {
  const monthName = Object.keys(MONTHS).join("|");
  const match = text.match(new RegExp(`(${monthName})\\s+(\\d{4})`, "i"));
  if (match) {
    return `${match[2]}-${MONTHS[match[1].toLowerCase()]}`;
  }

  const fileMatch = fileName.match(/(20\d{2})[-_. ](0[1-9]|1[0-2])/);
  return fileMatch ? `${fileMatch[1]}-${fileMatch[2]}` : currentMonth();
}

function moneyFromMatch(match, fallback = 0) {
  return match ? toNumber(match[1]) : fallback;
}

function firstMatch(text, pattern, fallback = "") {
  const match = text.match(pattern);
  return match ? match[1].trim() : fallback;
}

function createReceiptBase(providerType, provider, text, fileName) {
  return {
    id: uid("receipt"),
    providerType,
    provider,
    fileName,
    month: extractReceiptMonth(text, fileName),
    importedAt: new Date().toISOString(),
    account: "",
    address: "",
    area: 0,
    totalDue: 0,
    items: [],
  };
}

function parsePikReceipt(text, fileName) {
  const compact = compactText(text);
  const receipt = createReceiptBase("УК / ЕПД", "ПИК / ЕПД", text, fileName);
  const company = firstMatch(text, /ВАША УПРАВЛЯЮЩАЯ ОРГАНИЗАЦИЯ:\s*([^\n,]+)/i);

  receipt.provider = company || firstMatch(text, /(ООО\s+"ПИК-[^",]+")/i, "ПИК / ЕПД");
  receipt.account = firstMatch(text, /Лицевой счет:\s*([^\n]+)/i);
  receipt.address = firstMatch(text, /Адрес:\s*([^\n]+)/i);
  receipt.area = moneyFromMatch(text.match(/Площадь общая:\s*([\d\s]+,\d{2})/i), 0);

  const totalMatches = [...compact.matchAll(/Итого к оплате[:\s]+([\d\s]+,\d{2})\s*(?:руб|р\.)?/gi)];
  receipt.totalDue = totalMatches.length ? toNumber(totalMatches[totalMatches.length - 1][1]) : 0;

  const knownRows = [
    ["Содержание помещения", /Содержание помещения/, "housing_maintenance"],
    ["Содержание придомовой территории", /Содержание придомовой территории/, "territory_maintenance"],
    ["ГВС: Подогрев", /ГВС:\s*Подогрев/, "hot_water_heat"],
    ["ГВС: ХВ для ГВ", /ГВС:\s*ХВ для ГВ/, "hot_water_cold"],
    ["Отопление", /Отопление/, "heating"],
    ["Вывоз строительного мусора", /Вывоз строительного мусора/, "construction_waste"],
  ];

  knownRows.forEach(([name, pattern, service]) => {
    const row = parsePikServiceRow(compact, name, pattern, service);
    if (row && Math.abs(row.amount) > 0.005) {
      receipt.items.push(row);
    }
  });

  receipt.items.push(...parsePikMopElectricity(compact));

  const corrections = [
    ["Перерасчет: Электроэнергия МОП", /Электроэнергия МОП\s+(-?[\d\s]+,\d{2})\s+\d+/i],
    ["Перерасчет: Отопление", /Отопление\s+(-?[\d\s]+,\d{2})\s+[\w_]+/i],
  ];
  corrections.forEach(([name, pattern]) => {
    const match = compact.match(pattern);
    if (match) {
      receipt.items.push({
        name,
        volume: null,
        unit: "",
        rate: null,
        amount: toNumber(match[1]),
      });
    }
  });

  return receipt;
}

function parsePikServiceRow(text, name, pattern, service) {
  const num4 = "(-?\\d+(?:\\s\\d{3})*,\\d{4})";
  const unit = "(м2|м3|Гкал)?";
  const num2 = "(-?\\d+(?:\\s\\d{3})*,\\d{2})";
  const regex = new RegExp(`${pattern.source}\\s+${num4}\\s+${unit}\\s+${num2}\\s+${num2}`, "i");
  const match = text.match(regex);

  if (!match) return null;

  return {
    name,
    service,
    volume: toNumber(match[1]),
    unit: match[2] ?? "",
    rate: toNumber(match[3]),
    amount: toNumber(match[4]),
  };
}

function parsePikMopElectricity(text) {
  const num4 = "(-?\\d+(?:\\s\\d{3})*,\\d{4})";
  const num2 = "(-?\\d+(?:\\s\\d{3})*,\\d{2})";
  const regex = new RegExp(
    `ЭлектроэнергияМОП Ночь\\s+ЭлектроэнергияМОП Пик\\s+ЭлектроэнергияМОП Полупик\\s+${num4}\\s+${num4}\\s+${num4}\\s+кВт-ч\\s+кВт-ч\\s+кВт-ч\\s+${num2}\\s+${num2}\\s+${num2}\\s+${num2}\\s+${num2}\\s+${num2}`,
    "i",
  );
  const match = text.match(regex);

  if (!match) return [];

  const rows = [
    ["Электроэнергия МОП, ночь", "electricity_mop_night"],
    ["Электроэнергия МОП, пик", "electricity_mop_peak"],
    ["Электроэнергия МОП, полупик", "electricity_mop_half_peak"],
  ];
  return rows.map(([name, service], index) => ({
    name,
    service,
    volume: toNumber(match[1 + index]),
    unit: "кВт-ч",
    rate: toNumber(match[4 + index]),
    amount: toNumber(match[7 + index]),
  }));
}

function parseElectricityReceipt(text, fileName) {
  const compact = compactText(text);
  const receipt = createReceiptBase("Электроэнергия", "Поставщик электроэнергии", text, fileName);
  receipt.account = firstMatch(fileName, /(\d{4,}-\d{2,}-\d{2,})/);
  receipt.totalDue = moneyFromMatch(compact.match(/ИТОГО К ОПЛАТЕ:\s*([\d\s]+,\d{2})/i), 0);

  const debt = compact.match(/задолженности составляет \(руб\.\):\s*([\d\s]+,\d{2})/i);
  if (debt) {
    receipt.items.push({
      name: "Задолженность на начало периода",
      volume: null,
      unit: "",
      rate: null,
      amount: toNumber(debt[1]),
    });
  }

  const tariffRows = [
    ["Электроэнергия Т1, пик", "electricity_peak", /\(Т1\)\s*пик\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d\s]+,\d{2})\s+([\d\s]+,\d{2})/i],
    ["Электроэнергия Т2, ночь", "electricity_night", /\(Т2\)\s*ночь\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d\s]+,\d{2})\s+([\d\s]+,\d{2})/i],
    ["Электроэнергия Т3, полупик", "electricity_half_peak", /\(Т3\)\s*полупик\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d\s]+,\d{2})\s+([\d\s]+,\d{2})/i],
  ];

  tariffRows.forEach(([name, service, pattern]) => {
    const match = compact.match(pattern);
    if (!match) return;
    receipt.items.push({
      name,
      service,
      volume: toNumber(match[3]),
      unit: "кВт-ч",
      rate: toNumber(match[4]),
      amount: toNumber(match[5]),
    });
  });

  const charged = compact.match(/Начислено за электроэнергию в расч[её]тном периоде:\s*([\d\s]+,\d{2})/i);
  if (charged) {
    receipt.items.push({
      name: "Начислено за электроэнергию",
      volume: null,
      unit: "",
      rate: null,
      amount: toNumber(charged[1]),
    });
  }

  return receipt;
}

function parseGenericReceipt(text, fileName) {
  const compact = compactText(text);
  const receipt = createReceiptBase("Неизвестный формат", "Квитанция", text, fileName);
  receipt.totalDue = moneyFromMatch(compact.match(/(?:Итого к оплате|ИТОГО К ОПЛАТЕ|Сумма к оплате)[\s:]+([\d\s]+,\d{2})/i), 0);
  receipt.items.push({
    name: "Итог из документа",
    volume: null,
    unit: "",
    rate: null,
    amount: receipt.totalDue,
  });
  return receipt;
}

function setReceiptStatus(message, isError = false) {
  elements.receiptStatus.textContent = message;
  elements.receiptStatus.classList.remove("hidden");
  elements.receiptStatus.classList.toggle("warning", isError);
}

function setTariffStatus(message, isError = false) {
  elements.tariffStatus.textContent = message;
  elements.tariffStatus.classList.remove("hidden");
  elements.tariffStatus.classList.toggle("warning", isError);
}

function setServiceStatus(message, isError = false) {
  elements.serviceStatus.textContent = message;
  elements.serviceStatus.classList.remove("hidden");
  elements.serviceStatus.classList.toggle("warning", isError);
}

function serviceCategoryFor(service) {
  return Object.entries(SERVICE_GROUPS).find(([, group]) => group.services.includes(service))?.[0] ?? "other";
}

function addTariffsFromReceipt(object, receipt, category = "") {
  const from = monthStart(receipt.month ?? currentMonth());
  const source = receipt.providerType === "Неизвестный формат" ? receipt.fileName : `${receipt.providerType}: ${receipt.fileName}`;
  let added = 0;
  let skipped = 0;

  (receipt.items ?? []).forEach((item) => {
    const service = item.service ?? guessServiceFromReceiptItem(item.name);
    if (category && serviceCategoryFor(service) !== category) {
      skipped += 1;
      return;
    }
    if (!service || item.rate === null || item.rate === undefined || item.rate <= 0) {
      skipped += 1;
      return;
    }

    const unit = tariffUnitFromReceiptUnit(item.unit, item.volume);
    const exists = object.tariffs.some((tariff) => {
      return (
        tariff.service === service &&
        tariff.unit === unit &&
        tariff.from === from &&
        Math.abs(toNumber(tariff.rate) - toNumber(item.rate)) < 0.0001
      );
    });

    if (exists) {
      skipped += 1;
      return;
    }

    object.tariffs.push({
      id: uid("tariff"),
      service,
      rate: toNumber(item.rate),
      unit,
      from,
      to: "",
      note: `Из PDF: ${source}`,
    });
    added += 1;
  });

  return { added, skipped };
}

function tariffUnitFromReceiptUnit(unit, volume) {
  if (unit === "м2") return "per_m2";
  if (!unit && (volume === null || volume === undefined)) return "fixed";
  return "per_unit";
}

function guessServiceFromReceiptItem(name) {
  const value = name.toLowerCase();
  if (value.includes("т3") || value.includes("полупик")) {
    return value.includes("моп") ? "electricity_mop_half_peak" : "electricity_half_peak";
  }
  if (value.includes("т1") || value.includes("пик")) return value.includes("моп") ? "electricity_mop_peak" : "electricity_peak";
  if (value.includes("т2") || value.includes("ночь")) return value.includes("моп") ? "electricity_mop_night" : "electricity_night";
  if (value.includes("подогрев")) return "hot_water_heat";
  if (value.includes("хв для гв")) return "hot_water_cold";
  if (value.includes("отопление")) return "heating";
  if (value.includes("придом")) return "territory_maintenance";
  if (value.includes("содержание помещения")) return "housing_maintenance";
  if (value.includes("строительного мусора")) return "construction_waste";
  if (value.includes("холодная вода")) return "cold_water";
  if (value.includes("горячая вода")) return "hot_water";
  if (value.includes("водоотведение")) return "sewerage";
  if (value.includes("газ")) return "gas";
  return "";
}

function addObject() {
  if (state.objects.length >= MAX_OBJECTS) {
    alert("Можно вести не больше 10 объектов.");
    return;
  }
  elements.newObjectName.value = "";
  elements.newObjectRegion.value = "Москва";
  elements.newObjectCompany.value = "";
  elements.newObjectAccount.value = "";
  elements.newObjectAddress.value = "";
  elements.newObjectArea.value = "";
  elements.objectDialog.showModal();
}

function openTariffDialog(tariff = null) {
  editingTariffId = tariff?.id ?? null;
  elements.tariffService.value = tariff?.service ?? "electricity_day";
  elements.tariffRate.value = tariff?.rate ?? "";
  elements.tariffUnit.value = tariff?.unit ?? "per_unit";
  elements.tariffFrom.value = tariff?.from ?? `${new Date().getFullYear()}-01-01`;
  elements.tariffTo.value = tariff?.to ?? "";
  elements.tariffNote.value = tariff?.note ?? "";
  elements.tariffDialog.showModal();
}

function openReadingDialog(reading = null) {
  editingReadingId = reading?.id ?? null;
  elements.readingMonth.value = reading?.month ?? currentMonth();
  elements.readingElectricityDay.value = reading?.electricityDay ?? "";
  elements.readingElectricityPeak.value = reading?.electricityPeak ?? "";
  elements.readingElectricityNight.value = reading?.electricityNight ?? "";
  elements.readingElectricityHalfPeak.value = reading?.electricityHalfPeak ?? "";
  elements.readingColdWater.value = reading?.coldWater ?? "";
  elements.readingHotWater.value = reading?.hotWater ?? "";
  elements.readingGas.value = reading?.gas ?? "";
  elements.readingDialog.showModal();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bindEvents() {
  $("addObjectBtn").addEventListener("click", addObject);
  $("emptyAddBtn").addEventListener("click", addObject);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      $(button.dataset.closeDialog)?.close();
    });
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });

  elements.newObjectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const object = {
      id: uid("object"),
      name: elements.newObjectName.value.trim(),
      region: elements.newObjectRegion.value,
      company: elements.newObjectCompany.value.trim(),
      account: elements.newObjectAccount.value.trim(),
      address: elements.newObjectAddress.value.trim(),
      area: toNumber(elements.newObjectArea.value),
      tariffs: [],
      readings: [],
      receipts: [],
    };
    state.objects.push(object);
    selectedObjectId = object.id;
    elements.objectDialog.close();
    render();
  });

  elements.objectForm.addEventListener("input", () => {
    const object = selectedObject();
    if (!object) return;
    object.name = elements.objectName.value.trim() || "Без названия";
    object.region = elements.objectRegion.value;
    object.company = elements.objectCompany.value.trim();
    object.account = elements.objectAccount.value.trim();
    object.address = elements.objectAddress.value.trim();
    object.area = toNumber(elements.objectArea.value);
    renderObjects();
    renderCalculation(object);
    saveState();
  });

  elements.reminderDay.addEventListener("input", () => {
    state.settings.reminderDay = Math.min(28, Math.max(1, toNumber(elements.reminderDay.value) || 20));
    state.settings.dismissedReminderMonth = "";
    renderReminders();
    saveState();
  });

  elements.reminderEnabled.addEventListener("change", () => {
    state.settings.remindersEnabled = elements.reminderEnabled.checked;
    renderReminders();
    saveState();
  });

  elements.notificationBtn.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      alert("Этот браузер не поддерживает системные уведомления.");
      return;
    }

    const permission = await Notification.requestPermission();
    state.settings.browserNotifications = permission === "granted";
    if (state.settings.browserNotifications) {
      new Notification("Напоминания ЖКХ включены", {
        body: `Примерно ${state.settings.reminderDay} числа программа напомнит внести данные.`,
      });
    }
    renderReminders();
    saveState();
  });

  elements.dismissReminderBtn.addEventListener("click", () => {
    state.settings.dismissedReminderMonth = currentMonth();
    renderReminders();
    saveState();
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".tab-page").forEach((page) => page.classList.add("hidden"));
      tab.classList.add("active");
      $(`${tab.dataset.tab}Page`).classList.remove("hidden");
    });
  });

  $("calculateBtn").addEventListener("click", () => {
    const object = selectedObject();
    if (object) renderCalculation(object);
  });

  elements.calcMonth.addEventListener("change", () => {
    const object = selectedObject();
    if (object) renderCalculation(object);
  });

  $("addTariffBtn").addEventListener("click", () => openTariffDialog());

  elements.tariffForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const object = selectedObject();
    if (!object) return;

    const tariff = {
      id: editingTariffId ?? uid("tariff"),
      service: elements.tariffService.value,
      rate: toNumber(elements.tariffRate.value),
      unit: elements.tariffUnit.value,
      from: elements.tariffFrom.value,
      to: elements.tariffTo.value,
      note: elements.tariffNote.value.trim(),
    };

    object.tariffs = editingTariffId
      ? object.tariffs.map((item) => (item.id === editingTariffId ? tariff : item))
      : [...object.tariffs, tariff];

    elements.tariffDialog.close();
    render();
  });

  elements.tariffList.addEventListener("click", (event) => {
    const object = selectedObject();
    if (!object) return;
    const editId = event.target.dataset.editTariff;
    const deleteId = event.target.dataset.deleteTariff;
    if (editId) {
      openTariffDialog(object.tariffs.find((tariff) => tariff.id === editId));
    }
    if (deleteId) {
      object.tariffs = object.tariffs.filter((tariff) => tariff.id !== deleteId);
      render();
    }
  });

  elements.tariffPdfInput.addEventListener("change", async (event) => {
    const object = selectedObject();
    const file = event.target.files?.[0];
    if (!object || !file) return;

    try {
      setTariffStatus("Читаю PDF и вытаскиваю тарифы...");
      const text = await extractPdfText(file);
      const receipt = parseReceipt(text, file.name);
      const result = addTariffsFromReceipt(object, receipt);

      object.receipts = [receipt, ...(object.receipts ?? [])];
      if (receipt.provider && !object.company) object.company = receipt.provider;
      if (receipt.account && !object.account) object.account = receipt.account;
      if (receipt.address && !object.address) object.address = receipt.address;
      if (receipt.area && !object.area) object.area = receipt.area;

      setTariffStatus(`Готово: добавлено тарифов ${result.added}, пропущено ${result.skipped}.`);
      render();
    } catch (error) {
      setTariffStatus(error.message || "Не получилось разобрать тарифы из PDF.", true);
    } finally {
      event.target.value = "";
    }
  });

  elements.serviceCards.addEventListener("change", async (event) => {
    const category = event.target.dataset.serviceUpload;
    const object = selectedObject();
    const file = event.target.files?.[0];
    if (!category || !object || !file) return;

    try {
      setServiceStatus(`Читаю документ для раздела "${SERVICE_GROUPS[category].title}"...`);
      const text = await extractPdfText(file);
      const receipt = parseReceipt(text, file.name);
      receipt.category = category;
      const result = addTariffsFromReceipt(object, receipt, category);

      object.receipts = [receipt, ...(object.receipts ?? [])];
      if (receipt.provider && !object.company) object.company = receipt.provider;
      if (receipt.account && !object.account) object.account = receipt.account;
      if (receipt.address && !object.address) object.address = receipt.address;
      if (receipt.area && !object.area) object.area = receipt.area;

      setServiceStatus(
        `${SERVICE_GROUPS[category].title}: документ сохранен, тарифов добавлено ${result.added}, пропущено ${result.skipped}.`,
      );
      render();
    } catch (error) {
      setServiceStatus(error.message || "Не получилось разобрать документ.", true);
    } finally {
      event.target.value = "";
    }
  });

  $("addReadingBtn").addEventListener("click", () => openReadingDialog());

  elements.readingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const object = selectedObject();
    if (!object) return;

    const reading = {
      id: editingReadingId ?? uid("reading"),
      month: elements.readingMonth.value,
      electricityDay: toNumber(elements.readingElectricityDay.value),
      electricityPeak: toNumber(elements.readingElectricityPeak.value),
      electricityNight: toNumber(elements.readingElectricityNight.value),
      electricityHalfPeak: toNumber(elements.readingElectricityHalfPeak.value),
      coldWater: toNumber(elements.readingColdWater.value),
      hotWater: toNumber(elements.readingHotWater.value),
      gas: toNumber(elements.readingGas.value),
    };

    const existingSameMonth = object.readings.find(
      (item) => item.month === reading.month && item.id !== editingReadingId,
    );
    if (existingSameMonth) {
      alert("За этот месяц уже есть показания.");
      return;
    }

    object.readings = editingReadingId
      ? object.readings.map((item) => (item.id === editingReadingId ? reading : item))
      : [...object.readings, reading];

    elements.readingDialog.close();
    render();
  });

  elements.readingList.addEventListener("click", (event) => {
    const object = selectedObject();
    if (!object) return;
    const editId = event.target.dataset.editReading;
    const deleteId = event.target.dataset.deleteReading;
    if (editId) {
      openReadingDialog(object.readings.find((reading) => reading.id === editId));
    }
    if (deleteId) {
      object.readings = object.readings.filter((reading) => reading.id !== deleteId);
      render();
    }
  });

  elements.receiptInput.addEventListener("change", async (event) => {
    const object = selectedObject();
    const file = event.target.files?.[0];
    if (!object || !file) return;

    try {
      setReceiptStatus("Читаю PDF и ищу таблицы начислений...");
      const text = await extractPdfText(file);
      const receipt = parseReceipt(text, file.name);
      const tariffResult = addTariffsFromReceipt(object, receipt);
      object.receipts = [receipt, ...(object.receipts ?? [])];

      if (receipt.provider && !object.company) object.company = receipt.provider;
      if (receipt.account && !object.account) object.account = receipt.account;
      if (receipt.address && !object.address) object.address = receipt.address;
      if (receipt.area && !object.area) object.area = receipt.area;

      setReceiptStatus(
        `Готово: ${receipt.providerType}, строк начислений: ${receipt.items.length}, тарифов добавлено: ${tariffResult.added}.`,
      );
      render();
    } catch (error) {
      setReceiptStatus(error.message || "Не получилось разобрать PDF.", true);
    } finally {
      event.target.value = "";
    }
  });

  elements.receiptList.addEventListener("click", (event) => {
    const object = selectedObject();
    if (!object) return;
    const deleteId = event.target.dataset.deleteReceipt;
    if (deleteId) {
      object.receipts = (object.receipts ?? []).filter((receipt) => receipt.id !== deleteId);
      render();
    }
  });

  $("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jkh-raschet-${currentMonth()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  elements.importInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imported = JSON.parse(await file.text());
    if (!imported.objects || !Array.isArray(imported.objects)) {
      alert("Файл не похож на экспорт программы.");
      return;
    }
    state = {
      objects: imported.objects.slice(0, MAX_OBJECTS).map(normalizeObject),
      settings: normalizeSettings(imported.settings),
    };
    selectedObjectId = state.objects[0]?.id ?? null;
    render();
    event.target.value = "";
  });
}

bindEvents();
elements.calcMonth.value = currentMonth();
render();
