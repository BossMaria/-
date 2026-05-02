const STORAGE_KEY = "moscow-utility-calculator-v1";
const MAX_OBJECTS = 10;

const SERVICE_LABELS = {
  electricity_day: "Электроэнергия, день",
  electricity_night: "Электроэнергия, ночь",
  cold_water: "Холодная вода",
  hot_water: "Горячая вода",
  sewerage: "Водоотведение",
  gas: "Газ",
  membership: "Членские взносы",
};

const READING_KEYS = {
  electricity_day: "electricityDay",
  electricity_night: "electricityNight",
  cold_water: "coldWater",
  hot_water: "hotWater",
  gas: "gas",
};

const UNIT_LABELS = {
  per_unit: "за единицу",
  fixed: "фикс.",
  per_m2: "за м²",
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
  objectForm: $("objectForm"),
  objectName: $("objectName"),
  objectRegion: $("objectRegion"),
  objectCompany: $("objectCompany"),
  objectArea: $("objectArea"),
  calcMonth: $("calcMonth"),
  calculationResult: $("calculationResult"),
  tariffList: $("tariffList"),
  readingList: $("readingList"),
  objectDialog: $("objectDialog"),
  newObjectForm: $("newObjectForm"),
  newObjectName: $("newObjectName"),
  newObjectRegion: $("newObjectRegion"),
  newObjectCompany: $("newObjectCompany"),
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
  readingElectricityNight: $("readingElectricityNight"),
  readingColdWater: $("readingColdWater"),
  readingHotWater: $("readingHotWater"),
  readingGas: $("readingGas"),
  importInput: $("importInput"),
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.objects)) {
      return saved;
    }
  } catch {
    // Ignore broken saved data and start clean.
  }

  return {
    objects: [],
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
      <span>${escapeHtml(object.region)} · ${escapeHtml(object.company || "УК не указана")}</span>
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

  if (!object) return;

  elements.objectName.value = object.name;
  elements.objectRegion.value = object.region;
  elements.objectCompany.value = object.company ?? "";
  elements.objectArea.value = object.area ?? "";
  elements.calcMonth.value = elements.calcMonth.value || currentMonth();

  renderTariffs(object);
  renderReadings(object);
  renderCalculation(object);
}

function renderTariffs(object) {
  const rows = [...object.tariffs].sort((a, b) => {
    const byService = SERVICE_LABELS[a.service].localeCompare(SERVICE_LABELS[b.service], "ru");
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
            (tariff) => `
              <tr>
                <td>${SERVICE_LABELS[tariff.service]}</td>
                <td>${number.format(tariff.rate)} руб.</td>
                <td>${UNIT_LABELS[tariff.unit]}</td>
                <td>${formatDate(tariff.from)} - ${formatDate(tariff.to)}</td>
                <td>${escapeHtml(tariff.note ?? "")}</td>
                <td>
                  <button class="link-button" data-edit-tariff="${tariff.id}" type="button">Изм.</button>
                  <button class="link-button" data-delete-tariff="${tariff.id}" type="button">Удал.</button>
                </td>
              </tr>
            `,
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
          <th>Свет ночь</th>
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
                <td>${number.format(reading.electricityNight ?? 0)}</td>
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
      warnings.push(`Нет тарифа: ${SERVICE_LABELS[service]}.`);
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
  addMeterService("electricity_night", "electricityNight");
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

function addObject() {
  if (state.objects.length >= MAX_OBJECTS) {
    alert("Можно вести не больше 10 объектов.");
    return;
  }
  elements.newObjectName.value = "";
  elements.newObjectRegion.value = "Москва";
  elements.newObjectCompany.value = "";
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
  elements.readingElectricityNight.value = reading?.electricityNight ?? "";
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

  elements.newObjectForm.addEventListener("submit", (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const object = {
      id: uid("object"),
      name: elements.newObjectName.value.trim(),
      region: elements.newObjectRegion.value,
      company: elements.newObjectCompany.value.trim(),
      area: 0,
      tariffs: [],
      readings: [],
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
    object.area = toNumber(elements.objectArea.value);
    renderObjects();
    renderCalculation(object);
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
    if (event.submitter?.value === "cancel") return;
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

  $("addReadingBtn").addEventListener("click", () => openReadingDialog());

  elements.readingForm.addEventListener("submit", (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const object = selectedObject();
    if (!object) return;

    const reading = {
      id: editingReadingId ?? uid("reading"),
      month: elements.readingMonth.value,
      electricityDay: toNumber(elements.readingElectricityDay.value),
      electricityNight: toNumber(elements.readingElectricityNight.value),
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
      objects: imported.objects.slice(0, MAX_OBJECTS),
    };
    selectedObjectId = state.objects[0]?.id ?? null;
    render();
    event.target.value = "";
  });
}

bindEvents();
elements.calcMonth.value = currentMonth();
render();
