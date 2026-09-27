/* =========================================================================
   PITEX — products-data.js
   Single source of truth for every production line/machine shown across
   the site. index.html (homepage preview), production-lines.html (via
   categories-data.js counts) and products.html (category catalog) all
   read from `data` and render through the *same* `renderProductCard()`
   function — one component, one place the markup is defined, no
   duplicated card HTML between pages.

   `category` values match the 6 slugs owned by categories-data.js:
   pitting-slicing-line | olive-grading-line | filling-pasteurization-line |
   roasting-line | pepper-cucumber-perforation-line | pickle-mixing-line.
   ========================================================================= */

window.PitexProducts = (function () {
  'use strict';

  /* Feature-badge label -> icon, shown on every card instead of long
     specification paragraphs (see renderProductCard). One shared map so
     a badge always looks the same wherever it appears. */
  const BADGE_ICONS = {
    'Automation': 'bi-cpu-fill',
    'Capacity': 'bi-speedometer2',
    'Material': 'bi-shield-check',
    'Energy Efficient': 'bi-lightning-charge',
    'Export Ready': 'bi-globe2',
  };

  /* Icon map for the Product Details "Specifications" cards — one shared
     table so a spec label always gets the same icon wherever it appears
     (mirrors the BADGE_ICONS pattern above). */
  const SPEC_ICONS = {
    'Capacity': 'bi-speedometer2',
    'Power': 'bi-lightning-charge',
    'Automation Level': 'bi-cpu-fill',
    'Material': 'bi-shield-check',
    'Dimensions': 'bi-arrows-angle-expand',
    'Voltage': 'bi-plug-fill',
    'Production Output': 'bi-graph-up-arrow',
    'Country of Installation': 'bi-geo-alt-fill',
    'Machine Type': 'bi-gear-wide-connected',
    'Weight': 'bi-box-seam',
  };

  /* =======================================================================
     BILINGUAL DISPLAY LABELS
     Badge/spec labels are used as *lookup keys* (into BADGE_ICONS,
     SPEC_ICONS, and for matching/filtering) throughout the codebase, so —
     unlike title/description/etc. above — they stay plain English strings
     on each product record. Translated display text lives in these two
     shared dictionaries instead, keyed by that same internal English
     string. This is the recommended pattern any time a data field is both
     "text shown to users" AND "a value the code branches on": translate
     the *display*, never the *key*.
     ======================================================================= */
  const BADGE_LABELS = {
    'Automation': { en: 'Automation', ar: 'أتمتة' },
    'Capacity': { en: 'Capacity', ar: 'الطاقة الإنتاجية' },
    'Material': { en: 'Material', ar: 'الخامة' },
    'Energy Efficient': { en: 'Energy Efficient', ar: 'موفر للطاقة' },
    'Export Ready': { en: 'Export Ready', ar: 'جاهز للتصدير' },
  };

  const SPEC_LABELS = {
    'Capacity': { en: 'Capacity', ar: 'الطاقة الإنتاجية' },
    'Power': { en: 'Power', ar: 'القدرة' },
    'Automation Level': { en: 'Automation Level', ar: 'مستوى الأتمتة' },
    'Material': { en: 'Material', ar: 'الخامة' },
    'Dimensions': { en: 'Dimensions', ar: 'الأبعاد' },
    'Voltage': { en: 'Voltage', ar: 'الجهد الكهربائي' },
    'Production Output': { en: 'Production Output', ar: 'الإنتاجية' },
    'Country of Installation': { en: 'Country of Installation', ar: 'دولة التركيب' },
    'Machine Type': { en: 'Machine Type', ar: 'نوع الآلة' },
    'Weight': { en: 'Weight', ar: 'الوزن' },
  };


  const FEATURE_LABELS = {
    'High Efficiency': { en: 'High Efficiency', ar: 'كفاءة عالية' },
    'Water Recirculation': { en: 'Water Recirculation', ar: 'إعادة تدوير المياه' },
    'Easy Maintenance': { en: 'Easy Maintenance', ar: 'صيانة سهلة' },
    'Food Grade Materials': { en: 'Food Grade Materials', ar: 'خامات ملامسة للغذاء' },
    'Automatic Operation': { en: 'Automatic Operation', ar: 'تشغيل آلي' },
    'Industrial Durability': { en: 'Industrial Durability', ar: 'متانة صناعية' },
    'Low Energy Consumption': { en: 'Low Energy Consumption', ar: 'استهلاك طاقة منخفض' },
    'Even Heat Distribution': { en: 'Even Heat Distribution', ar: 'توزيع حراري متساوٍ' },
  };
  /** Looks up the localized display label for an internal badge/spec key,
   *  falling back to the raw key itself if it hasn't been added to the
   *  dictionaries above yet (never breaks a card, just shows English). */
  function labelFor(dictionary, key) {
    const entry = dictionary[key];
    if (!entry) return key;
    return window.I18N && window.I18N.pick ? window.I18N.pick(entry) : entry.en;
  }

  const data = [
    {
      id: 'olive-receiving-washing',
      title: { en: 'Olive Receiving & Washing Line', ar: 'خط استقبال وغسل الزيتون' },
      category: 'olive-grading-line',
      categoryLabel: { en: 'Olive Grading Line (Standard Olive Sizing)', ar: 'خط فرز الزيتون (التدريج القياسي)' },
      featured: true,
      status: { en: 'Best Seller', ar: 'الأكثر مبيعًا' },
      image: 'assets/images/machine-washing.jpg',
      alt: 'PITEX olive receiving and washing line on the production floor',
      description: { en: 'High-capacity automated reception, leaf removal, and double-stage washing system.', ar: 'نظام استقبال آلي عالي الطاقة مزود بإزالة الأوراق وغسل ثنائي المراحل.' },
      longDescription: { en: 'The reception line is the first checkpoint of quality in the entire mill. Olives are gently received into high-capacity hoppers, cleared of leaves and twigs with air separation, then carried through a low-impact double-stage wash that removes soil and residue without bruising the fruit — protecting the flavor and acidity of every batch that follows it into milling.', ar: 'خط الاستقبال هو أول نقطة فحص للجودة في المعصرة بأكملها. يُستقبل الزيتون برفق في صوامع عالية السعة، ويُخلَّص من الأوراق والأغصان عبر الفصل الهوائي، ثم يمر بغسل ثنائي المراحل منخفض التأثير يزيل التراب والشوائب دون أن يتسبب في كدمات للثمار — حفاظًا على نكهة وحموضة كل دفعة تدخل بعدها إلى الطحن.' },
      icons: ['bi-speedometer2', 'bi-droplet-half', 'bi-shield-check'],
      badges: ['Capacity', 'Material', 'Export Ready'],
      images: ['assets/images/machine-washing.jpg', 'assets/images/case-florence.jpg', 'assets/images/machine-milling.jpg', 'assets/images/insight-waste-recovery.jpg'],
      availability: { en: 'In Stock', ar: 'متوفر بالمخزون' },
      exportReady: true,
      warranty: { en: '24-Month Warranty', ar: 'ضمان 24 شهرًا' },
      specifications: [
        { label: 'Capacity', value: '4,000 – 12,000 kg/h' },
        { label: 'Power', value: '18.5 kW' },
        { label: 'Automation Level', value: 'Fully Automatic' },
        { label: 'Material', value: 'AISI 304 Stainless Steel' },
        { label: 'Dimensions', value: '6.2 × 1.8 × 2.4 m' },
        { label: 'Voltage', value: '380V / 50Hz, 3-Phase' },
      ],
      features: [
        { icon: 'bi-lightning-charge', title: 'High Efficiency', text: { en: 'High-throughput intake sized for peak harvest-day deliveries.', ar: 'استقبال عالي الطاقة مصمم لتلبية ذروة توريد موسم الحصاد.' } },
        { icon: 'bi-droplet-half', title: 'Water Recirculation', text: { en: 'Filtered wash-water reuse cuts fresh-water consumption.', ar: 'إعادة استخدام مياه الغسيل المُرشَّحة تقلل من استهلاك المياه العذبة.' } },
        { icon: 'bi-tools', title: 'Easy Maintenance', text: { en: 'Tool-free access panels for fast cleaning between batches.', ar: 'ألواح وصول دون أدوات لتنظيف سريع بين الدفعات.' } },
        { icon: 'bi-shield-check', title: 'Food Grade Materials', text: { en: 'Full AISI 304 stainless contact surfaces throughout.', ar: 'أسطح تلامس بالكامل من الفولاذ المقاوم للصدأ AISI 304.' } },
        { icon: 'bi-cpu-fill', title: 'Automatic Operation', text: { en: 'PLC-controlled flow with adjustable wash-cycle timing.', ar: 'تدفق يُتحكم به عبر PLC مع توقيت دورة غسيل قابل للتعديل.' } },
        { icon: 'bi-gem', title: 'Industrial Durability', text: { en: 'Built for continuous multi-season operation with minimal downtime.', ar: 'مصممة للتشغيل المستمر عبر مواسم متعددة بأقل توقف.' } },
      ],
      applications: [{ en: 'Bulk Reception', ar: 'استقبال كميات كبيرة' }, { en: 'Leaf & Twig Removal', ar: 'إزالة الأوراق والأغصان' }, { en: 'Double-Stage Washing', ar: 'غسل ثنائي المراحل' }, { en: 'Peak-Season Intake', ar: 'استيعاب ذروة الموسم' }],
    },
    {
      id: 'sorting-inspection',
      title: { en: 'Sorting & Inspection System', ar: 'نظام الفرز والفحص' },
      category: 'olive-grading-line',
      categoryLabel: { en: 'Olive Grading Line (Standard Olive Sizing)', ar: 'خط فرز الزيتون (التدريج القياسي)' },
      image: 'assets/images/machine-milling.jpg',
      alt: 'Optical sorting and inspection belts for olives',
      description: { en: 'Precision optical and manual inspection belts for optimal olive quality control.', ar: 'أحزمة فحص بصري ويدوي دقيقة لضمان أفضل مستوى من جودة الزيتون.' },
      longDescription: { en: 'Positioned right after washing, this system combines optical sorting with a manual inspection belt so foreign material and substandard fruit never reach the mill. Vision cameras flag color and size deviations in real time while operators handle final quality checks from an ergonomic, well-lit station.', ar: 'يقع هذا النظام مباشرة بعد الغسل، ويجمع بين الفرز البصري وحزام الفحص اليدوي بحيث لا تصل المواد الغريبة أو الثمار غير المطابقة إلى المعصرة أبدًا. تكتشف كاميرات الرؤية انحرافات اللون والحجم في الوقت الفعلي بينما يتولى المشغلون الفحوصات النهائية من محطة مريحة وجيدة الإضاءة.' },
      icons: ['bi-eye', 'bi-cpu-fill', 'bi-shield-check'],
      badges: ['Automation', 'Material', 'Export Ready'],
      images: ['assets/images/machine-milling.jpg', 'assets/images/case-andalusia.jpg'],
      availability: { en: 'Made to Order', ar: 'يُصنّع حسب الطلب' },
      exportReady: true,
      warranty: { en: '18-Month Warranty', ar: 'ضمان 18 شهرًا' },
      specifications: [
        { label: 'Capacity', value: '3,000 – 9,000 kg/h' },
        { label: 'Automation Level', value: 'Vision-Assisted' },
        { label: 'Material', value: 'Stainless Steel Frame' },
        { label: 'Voltage', value: '380V / 50Hz, 3-Phase' },
        { label: 'Machine Type', value: 'Optical + Manual Belt' },
      ],
      features: [
        { icon: 'bi-eye', title: 'High Efficiency', text: { en: 'Optical cameras catch deviations a manual-only line would miss.', ar: 'تلتقط الكاميرات البصرية انحرافات يفوتها خط يدوي بالكامل.' } },
        { icon: 'bi-cpu-fill', title: 'Automatic Operation', text: { en: 'Real-time vision sorting reduces manual sorting labor.', ar: 'يقلل الفرز البصري في الوقت الفعلي من عمالة الفرز اليدوي.' } },
        { icon: 'bi-shield-check', title: 'Food Grade Materials', text: { en: 'Belt and frame components rated for direct food contact.', ar: 'مكونات الحزام والإطار معتمدة للتلامس المباشر مع الغذاء.' } },
        { icon: 'bi-tools', title: 'Easy Maintenance', text: { en: 'Modular belt sections lift out for quick cleaning.', ar: 'أقسام الحزام المعيارية تُرفع بسهولة للتنظيف السريع.' } },
        { icon: 'bi-gem', title: 'Industrial Durability', text: { en: 'Continuous-duty motors rated for full-season harvest runs.', ar: 'محركات للعمل المستمر معتمدة لمواسم حصاد كاملة.' } },
      ],
      applications: [{ en: 'Optical Sorting', ar: 'فرز بصري' }, { en: 'Manual Quality Inspection', ar: 'فحص جودة يدوي' }, { en: 'Foreign Material Removal', ar: 'إزالة المواد الغريبة' }],
    },
    {
      id: 'conveyor-systems',
      title: { en: 'Conveyor Systems', ar: 'أنظمة النقل الناقل' },
      category: 'olive-grading-line',
      categoryLabel: { en: 'Olive Grading Line (Standard Olive Sizing)', ar: 'خط فرز الزيتون (التدريج القياسي)' },
      image: 'assets/images/case-florence.jpg',
      alt: 'Modular conveyor systems synchronizing plant flow',
      description: { en: 'Custom modular belt and roller solutions for synchronized plant flow.', ar: 'حلول أحزمة وبكرات معيارية مخصصة لتدفق متزامن داخل المصنع.' },
      longDescription: { en: 'Custom-engineered modular belt and roller conveyors link every stage of the plant into one synchronized flow. Layouts are configured per site — incline, decline, or straight-run — so material moves at a matched pace from reception through to milling with no bottlenecks.', ar: 'سيور وبكرات نقل معيارية مصممة خصيصًا تربط كل مرحلة من مراحل المصنع في تدفق واحد متزامن. تُهيَّأ التخطيطات حسب كل موقع — صاعدة أو هابطة أو مستقيمة — بحيث تتحرك المواد بوتيرة متوافقة من الاستقبال وحتى الطحن دون أي اختناقات.' },
      icons: ['bi-arrow-left-right', 'bi-gear', 'bi-shield-check'],
      badges: ['Capacity', 'Automation', 'Material'],
      images: ['assets/images/case-florence.jpg', 'assets/images/machine-washing.jpg', 'assets/images/insight-modular-series.jpg'],
      availability: { en: 'Made to Order', ar: 'يُصنّع حسب الطلب' },
      exportReady: false,
      warranty: { en: '12-Month Warranty', ar: 'ضمان 12 شهرًا' },
      specifications: [
        { label: 'Capacity', value: 'Up to 15,000 kg/h' },
        { label: 'Power', value: '2.2 – 7.5 kW per section' },
        { label: 'Material', value: 'Galvanized Steel / PVC Belt' },
        { label: 'Dimensions', value: 'Custom per layout' },
        { label: 'Machine Type', value: 'Modular Belt & Roller' },
      ],
      features: [
        { icon: 'bi-arrow-left-right', title: 'High Efficiency', text: { en: 'Matched belt speeds keep the whole line moving without gaps.', ar: 'سرعات أحزمة متطابقة تُبقي الخط بأكمله يتحرك دون فجوات.' } },
        { icon: 'bi-gear', title: 'Easy Maintenance', text: { en: 'Standardized modular sections simplify spare-part stocking.', ar: 'أقسام معيارية موحدة تُسهّل تخزين قطع الغيار.' } },
        { icon: 'bi-shield-check', title: 'Industrial Durability', text: { en: 'Reinforced frames built for continuous plant-floor duty.', ar: 'إطارات مقواة مصممة للعمل المستمر في أرضية المصنع.' } },
        { icon: 'bi-cpu-fill', title: 'Automatic Operation', text: { en: 'Variable-frequency drives keep every section in sync.', ar: 'محركات بترددات متغيرة تُبقي كل قسم متزامنًا.' } },
      ],
      applications: [{ en: 'Inter-Stage Transport', ar: 'نقل بين المراحل' }, { en: 'Plant Layout Synchronization', ar: 'تزامن تخطيط المصنع' }, { en: 'Incline & Decline Runs', ar: 'مسارات صاعدة وهابطة' }],
    },
    {
      id: 'crushing-milling',
      title: { en: 'Crushing & Milling Machine', ar: 'آلة الطحن والسحق' },
      category: 'pitting-slicing-line',
      categoryLabel: { en: 'Pitting & Slicing Line', ar: 'خط نزع النوى والتقطيع' },
      image: 'assets/images/machine-decanting.jpg',
      alt: 'Stainless steel hammer mill crushing olives',
      description: { en: 'Stainless steel hammer mills designed for efficient cellular breakage of olives.', ar: 'مطاحن مطرقية من الفولاذ المقاوم للصدأ مصممة لتفتيت خلايا الزيتون بكفاءة.' },
      longDescription: { en: 'Our hammer mills deliver consistent, controlled cellular breakage of the olive paste — the essential first step to releasing oil during malaxing. Interchangeable screens let operators fine-tune paste texture per cultivar, and the fully stainless build keeps every contact surface food-safe.', ar: 'توفر مطاحننا المطرقية تفتيتًا خلويًا ثابتًا ومضبوطًا لعجينة الزيتون — وهي الخطوة الأولى الأساسية لتحرير الزيت أثناء العجن. تتيح الغرابيل القابلة للتبديل للمشغلين ضبط قوام العجينة بدقة حسب كل صنف، ويحافظ الهيكل الكامل من الفولاذ المقاوم للصدأ على سلامة جميع أسطح التلامس غذائيًا.' },
      icons: ['bi-gear-wide-connected', 'bi-lightning-charge', 'bi-shield-check'],
      badges: ['Automation', 'Capacity', 'Material'],
      images: ['assets/images/machine-decanting.jpg', 'assets/images/insight-ai-pressing.jpg', 'assets/images/case-florence.jpg'],
      availability: { en: 'In Stock', ar: 'متوفر بالمخزون' },
      exportReady: true,
      warranty: { en: '24-Month Warranty', ar: 'ضمان 24 شهرًا' },
      specifications: [
        { label: 'Capacity', value: '2,000 – 6,000 kg/h' },
        { label: 'Power', value: '30 kW' },
        { label: 'Automation Level', value: 'Semi-Automatic' },
        { label: 'Material', value: 'AISI 304 Stainless Steel' },
        { label: 'Voltage', value: '380V / 50Hz, 3-Phase' },
      ],
      features: [
        { icon: 'bi-gear-wide-connected', title: 'High Efficiency', text: { en: 'Interchangeable screens tune paste texture per cultivar.', ar: 'غرابيل قابلة للتبديل تضبط قوام العجينة حسب الصنف.' } },
        { icon: 'bi-lightning-charge', title: 'Low Energy Consumption', text: { en: 'Optimized hammer geometry reduces power draw per ton.', ar: 'هندسة مطرقة محسّنة تقلل استهلاك الطاقة لكل طن.' } },
        { icon: 'bi-shield-check', title: 'Food Grade Materials', text: { en: 'Fully stainless contact surfaces throughout the chamber.', ar: 'أسطح تلامس من الفولاذ المقاوم للصدأ بالكامل داخل الغرفة.' } },
        { icon: 'bi-tools', title: 'Easy Maintenance', text: { en: 'Quick-release screen and hammer access for fast servicing.', ar: 'وصول سريع للغرابيل والمطارق لصيانة سريعة.' } },
        { icon: 'bi-gem', title: 'Industrial Durability', text: { en: 'Hardened hammers built for season-long continuous duty.', ar: 'مطارق مقواة مصممة للعمل المستمر طوال الموسم.' } },
      ],
      applications: [{ en: 'Cellular Breakage', ar: 'تفتيت خلوي' }, { en: 'Paste Preparation', ar: 'تجهيز العجينة' }, { en: 'Cultivar-Specific Milling', ar: 'طحن خاص بالصنف' }],
    },
    {
      id: 'malaxing-system',
      title: { en: 'Malaxing System', ar: 'نظام العجن (المالاكسور)' },
      category: 'pitting-slicing-line',
      categoryLabel: { en: 'Pitting & Slicing Line', ar: 'خط نزع النوى والتقطيع' },
      featured: true,
      status: { en: 'Best Seller', ar: 'الأكثر مبيعًا' },
      image: 'assets/images/case-andalusia.jpg',
      alt: 'Horizontal thermal-controlled malaxing units',
      description: { en: 'Horizontal thermal-controlled kneading units to facilitate oil drop aggregation.', ar: 'وحدات عجن أفقية بتحكم حراري لتسهيل تجمع قطرات الزيت.' },
      longDescription: { en: 'Slow, temperature-controlled kneading coaxes microscopic oil droplets in the paste to aggregate into larger drops the decanter can efficiently extract. Our horizontal malaxers hold a tight thermal band throughout the cycle, protecting polyphenol content and preserving the fresh, fruity character of the finished oil.', ar: 'يُحفّز العجن البطيء ذو التحكم الحراري قطرات الزيت المجهرية داخل العجينة على التجمع في قطرات أكبر يمكن للديكانتر استخلاصها بكفاءة. تحافظ أجهزة العجن الأفقية لدينا على نطاق حراري دقيق طوال الدورة، ما يحمي محتوى البوليفينول ويحافظ على الطابع الطازج والفاكهي للزيت النهائي.' },
      icons: ['bi-thermometer-half', 'bi-arrow-repeat', 'bi-shield-check'],
      badges: ['Energy Efficient', 'Material', 'Capacity'],
      images: ['assets/images/case-andalusia.jpg', 'assets/images/machine-decanting-focused.jpg', 'assets/images/insight-ai-pressing.jpg', 'assets/images/case-florence.jpg'],
      availability: { en: 'In Stock', ar: 'متوفر بالمخزون' },
      exportReady: true,
      warranty: { en: '24-Month Warranty', ar: 'ضمان 24 شهرًا' },
      specifications: [
        { label: 'Capacity', value: '2,000 – 8,000 kg/h' },
        { label: 'Power', value: '15 kW' },
        { label: 'Automation Level', value: 'Fully Automatic' },
        { label: 'Material', value: 'AISI 316 Stainless Steel' },
        { label: 'Dimensions', value: '5.4 × 1.6 × 1.9 m' },
        { label: 'Production Output', value: 'Up to 8,000 kg/h paste' },
      ],
      features: [
        { icon: 'bi-thermometer-half', title: 'Automatic Operation', text: { en: 'Closed-loop thermal control holds a precise malaxing band.', ar: 'تحكم حراري بحلقة مغلقة يحافظ على نطاق عجن دقيق.' } },
        { icon: 'bi-lightning-charge', title: 'Low Energy Consumption', text: { en: 'Insulated jacketed walls minimize reheating energy loss.', ar: 'جدران معزولة مزدوجة الطبقة تقلل فقد الطاقة عند إعادة التسخين.' } },
        { icon: 'bi-shield-check', title: 'Food Grade Materials', text: { en: 'AISI 316 paddles and basin resist acidity and oxidation.', ar: 'مجاديف وحوض من AISI 316 تقاوم الحموضة والأكسدة.' } },
        { icon: 'bi-arrow-repeat', title: 'High Efficiency', text: { en: 'Optimized paddle geometry aggregates oil droplets faster.', ar: 'هندسة مجداف محسّنة تجمع قطرات الزيت بشكل أسرع.' } },
        { icon: 'bi-gem', title: 'Industrial Durability', text: { en: 'Sealed bearings rated for continuous multi-shift operation.', ar: 'محامل مُحكمة معتمدة للتشغيل المستمر متعدد الورديات.' } },
      ],
      applications: [{ en: 'Oil Droplet Aggregation', ar: 'تجميع قطرات الزيت' }, { en: 'Thermal-Controlled Kneading', ar: 'عجن بتحكم حراري' }, { en: 'Polyphenol Preservation', ar: 'الحفاظ على البوليفينول' }],
    },
    {
      id: 'extraction-decanter',
      title: { en: 'Olive Oil Extraction (Decanter)', ar: 'استخلاص زيت الزيتون (الديكانتر)' },
      category: 'pitting-slicing-line',
      categoryLabel: { en: 'Pitting & Slicing Line', ar: 'خط نزع النوى والتقطيع' },
      status: { en: 'Popular', ar: 'الأكثر رواجًا' },
      image: 'assets/images/case-florence.jpg',
      alt: 'High-speed centrifugal decanter for olive oil extraction',
      description: { en: 'High-speed centrifugal horizontal extraction for maximum yield and oil purity.', ar: 'استخلاص أفقي بالطرد المركزي عالي السرعة لأقصى إنتاجية ونقاء للزيت.' },
      longDescription: { en: 'The two-phase horizontal decanter separates oil, water, and pomace by high-speed centrifugal force in a single continuous pass. Precision-balanced bowls minimize vibration at speed, delivering maximum yield with the lowest possible energy and water use per ton processed.', ar: 'يفصل الديكانتر الأفقي ثنائي الطور الزيت والماء وتفل الزيتون بقوة طرد مركزي عالية السرعة في مسار مستمر واحد. تقلل الأحواض المتوازنة بدقة من الاهتزاز عند السرعة العالية، ما يوفر أقصى إنتاجية بأقل استهلاك ممكن للطاقة والماء لكل طن مُعالَج.' },
      icons: ['bi-droplet', 'bi-speedometer2', 'bi-shield-check'],
      badges: ['Capacity', 'Automation', 'Export Ready'],
      images: ['assets/images/case-florence.jpg', 'assets/images/machine-decanting.jpg', 'assets/images/insight-modular-series.jpg'],
      availability: { en: 'In Stock', ar: 'متوفر بالمخزون' },
      exportReady: true,
      warranty: { en: '24-Month Warranty', ar: 'ضمان 24 شهرًا' },
      specifications: [
        { label: 'Capacity', value: '2,500 – 8,000 kg/h' },
        { label: 'Power', value: '37 kW' },
        { label: 'Automation Level', value: 'Fully Automatic' },
        { label: 'Material', value: 'AISI 316 Stainless Steel' },
        { label: 'Machine Type', value: 'Two-Phase Horizontal Decanter' },
      ],
      features: [
        { icon: 'bi-speedometer2', title: 'High Efficiency', text: { en: 'Precision-balanced bowl runs at speed with minimal vibration.', ar: 'حوض متوازن بدقة يعمل بسرعة وبأقل اهتزاز.' } },
        { icon: 'bi-droplet', title: 'Low Energy Consumption', text: { en: 'Two-phase design cuts process water use significantly.', ar: 'تصميم ثنائي الطور يقلل استهلاك مياه العملية بشكل كبير.' } },
        { icon: 'bi-cpu-fill', title: 'Automatic Operation', text: { en: 'PLC-controlled differential speed for consistent separation.', ar: 'سرعة تفاضلية يتحكم بها PLC لفصل ثابت.' } },
        { icon: 'bi-shield-check', title: 'Food Grade Materials', text: { en: 'Full AISI 316 bowl and scroll construction.', ar: 'حوض ولولب مصنوعان بالكامل من AISI 316.' } },
        { icon: 'bi-globe2', title: 'Industrial Durability', text: { en: 'Export-certified build for international installations.', ar: 'بناء معتمد للتصدير مناسب للتركيبات الدولية.' } },
      ],
      applications: [{ en: 'Centrifugal Separation', ar: 'فصل بالطرد المركزي' }, { en: 'Two-Phase Extraction', ar: 'استخلاص ثنائي الطور' }, { en: 'High-Yield Processing', ar: 'معالجة عالية الإنتاجية' }],
    },
    {
      id: 'vertical-separator',
      title: { en: 'Vertical Separator', ar: 'الفاصل العمودي' },
      category: 'pitting-slicing-line',
      categoryLabel: { en: 'Pitting & Slicing Line', ar: 'خط نزع النوى والتقطيع' },
      image: 'assets/images/insight-ai-pressing.jpg',
      alt: 'Vertical separator tower for final oil clarification',
      description: { en: 'High-precision final clarification of olive oil from remaining moisture.', ar: 'توضيح نهائي عالي الدقة لزيت الزيتون من الرطوبة المتبقية.' },
      longDescription: { en: 'The final clarification step: a vertical centrifugal separator removes any remaining moisture and micro-particles from the decanted oil, leaving a bright, clean product ready for storage or immediate bottling.', ar: 'خطوة التوضيح الأخيرة: يزيل الفاصل المركزي العمودي أي رطوبة أو جسيمات دقيقة متبقية من الزيت بعد الديكانتر، تاركًا منتجًا صافيًا ونظيفًا جاهزًا للتخزين أو التعبئة الفورية.' },
      icons: ['bi-funnel', 'bi-droplet-half', 'bi-shield-check'],
      badges: ['Material', 'Capacity', 'Export Ready'],
      images: ['assets/images/insight-ai-pressing.jpg', 'assets/images/case-andalusia.jpg'],
      availability: { en: 'Made to Order', ar: 'يُصنّع حسب الطلب' },
      exportReady: true,
      warranty: { en: '18-Month Warranty', ar: 'ضمان 18 شهرًا' },
      specifications: [
        { label: 'Capacity', value: '2,000 – 6,000 kg/h' },
        { label: 'Power', value: '11 kW' },
        { label: 'Material', value: 'AISI 316 Stainless Steel' },
        { label: 'Machine Type', value: 'Vertical Centrifugal Separator' },
      ],
      features: [
        { icon: 'bi-funnel', title: 'High Efficiency', text: { en: 'Final-stage clarification removes residual moisture and fines.', ar: 'توضيح المرحلة الأخيرة يزيل الرطوبة والجسيمات الدقيقة المتبقية.' } },
        { icon: 'bi-droplet-half', title: 'Food Grade Materials', text: { en: 'Sealed stainless bowl protects oil quality throughout.', ar: 'حوض فولاذي مُحكم يحمي جودة الزيت طوال العملية.' } },
        { icon: 'bi-shield-check', title: 'Industrial Durability', text: { en: 'Precision-balanced rotor for long service intervals.', ar: 'دوار متوازن بدقة لفترات خدمة أطول.' } },
        { icon: 'bi-tools', title: 'Easy Maintenance', text: { en: 'Self-cleaning discharge simplifies daily servicing.', ar: 'تفريغ ذاتي التنظيف يُسهّل الصيانة اليومية.' } },
      ],
      applications: [{ en: 'Final Clarification', ar: 'توضيح نهائي' }, { en: 'Moisture Removal', ar: 'إزالة الرطوبة' }, { en: 'Pre-Storage Polishing', ar: 'تلميع ما قبل التخزين' }],
    },
    {
      id: 'filtration-system',
      title: { en: 'Filtration System', ar: 'نظام الترشيح' },
      category: 'pitting-slicing-line',
      categoryLabel: { en: 'Pitting & Slicing Line', ar: 'خط نزع النوى والتقطيع' },
      image: 'assets/images/insight-modular-series.jpg',
      alt: 'Plate filter press filtration system',
      description: { en: 'Advanced paper and plate filter presses for a bright, crystal-clear final product.', ar: 'مكابس ترشيح ورقية ولوحية متقدمة لمنتج نهائي صافٍ وشفاف.' },
      longDescription: { en: 'Advanced paper and plate filter presses give a bright, crystal-clear finished oil ready for retail packaging. Modular plate counts scale filtration capacity to match any line size without changing the footprint.', ar: 'توفر مكابس الترشيح الورقية واللوحية المتقدمة زيتًا نهائيًا صافيًا وشفافًا جاهزًا للتعبئة والبيع بالتجزئة. يتيح عدد الألواح المعياري توسيع طاقة الترشيح لتناسب أي حجم خط دون تغيير المساحة المطلوبة.' },
      icons: ['bi-filter', 'bi-droplet', 'bi-shield-check'],
      badges: ['Material', 'Export Ready', 'Energy Efficient'],
      images: ['assets/images/insight-modular-series.jpg', 'assets/images/machine-milling.jpg', 'assets/images/insight-waste-recovery.jpg'],
      availability: { en: 'In Stock', ar: 'متوفر بالمخزون' },
      exportReady: true,
      warranty: { en: '18-Month Warranty', ar: 'ضمان 18 شهرًا' },
      specifications: [
        { label: 'Capacity', value: '1,500 – 5,000 L/h' },
        { label: 'Power', value: '5.5 kW' },
        { label: 'Material', value: 'Stainless Steel / Cellulose Media' },
        { label: 'Machine Type', value: 'Modular Plate Filter Press' },
      ],
      features: [
        { icon: 'bi-filter', title: 'High Efficiency', text: { en: 'Modular plate stacks scale filtration to any line size.', ar: 'أكوام ألواح معيارية تُوسّع الترشيح ليناسب أي حجم خط.' } },
        { icon: 'bi-droplet', title: 'Low Energy Consumption', text: { en: 'Gravity-assisted flow reduces pumping energy needs.', ar: 'تدفق بمساعدة الجاذبية يقلل احتياج طاقة الضخ.' } },
        { icon: 'bi-shield-check', title: 'Food Grade Materials', text: { en: 'Cellulose media rated for direct food contact.', ar: 'وسائط سليلوزية معتمدة للتلامس المباشر مع الغذاء.' } },
        { icon: 'bi-tools', title: 'Easy Maintenance', text: { en: 'Quick plate-release handles for fast media changeovers.', ar: 'مقابض تحرير سريع للألواح لتغيير الوسائط بسرعة.' } },
      ],
      applications: [{ en: 'Final Filtration', ar: 'ترشيح نهائي' }, { en: 'Retail-Ready Clarity', ar: 'نقاء جاهز للبيع بالتجزئة' }, { en: 'Bottling Preparation', ar: 'تجهيز للتعبئة' }],
    },
    {
      id: 'storage-tanks',
      title: { en: 'Olive Oil Storage Tanks', ar: 'خزانات تخزين زيت الزيتون' },
      category: 'pickle-mixing-line',
      categoryLabel: { en: 'Pickle Mixing Line', ar: 'خط خلط المخللات' },
      image: 'assets/images/insight-waste-recovery.jpg',
      alt: 'Stainless steel olive oil storage tanks',
      description: { en: 'Nitrogen-inertized stainless steel tanks for premium long-term preservation.', ar: 'خزانات فولاذ مقاوم للصدأ خاملة بالنيتروجين لحفظ ممتاز طويل الأمد.' },
      longDescription: { en: 'Nitrogen-inertized stainless tanks shield stored oil from oxygen throughout its shelf life, preserving aroma, flavor, and polyphenol content between harvest and shipment. Available in a full range of capacities to match any cellar layout.', ar: 'تحمي الخزانات الفولاذية الخاملة بالنيتروجين الزيت المخزَّن من الأكسجين طوال مدة صلاحيته، محافظةً على الرائحة والنكهة ومحتوى البوليفينول بين موسم الحصاد والشحن. متوفرة بمجموعة كاملة من السعات لتناسب أي تصميم قبو.' },
      icons: ['bi-archive', 'bi-thermometer-half', 'bi-shield-check'],
      badges: ['Material', 'Capacity', 'Export Ready'],
      images: ['assets/images/insight-waste-recovery.jpg', 'assets/images/about-hero-facility.jpg', 'assets/images/case-florence.jpg'],
      availability: { en: 'Made to Order', ar: 'يُصنّع حسب الطلب' },
      exportReady: true,
      warranty: { en: '36-Month Warranty', ar: 'ضمان 36 شهرًا' },
      specifications: [
        { label: 'Capacity', value: '5,000 – 50,000 L per unit' },
        { label: 'Material', value: 'AISI 304 Stainless Steel' },
        { label: 'Dimensions', value: 'Custom per capacity' },
        { label: 'Machine Type', value: 'Nitrogen-Inertized Tank' },
      ],
      features: [
        { icon: 'bi-archive', title: 'Industrial Durability', text: { en: 'Double-wall stainless construction rated for decades of use.', ar: 'بناء فولاذي مزدوج الجدار معتمد لعقود من الاستخدام.' } },
        { icon: 'bi-thermometer-half', title: 'High Efficiency', text: { en: 'Insulated jacket option stabilizes storage temperature.', ar: 'خيار الغطاء العازل يُثبّت درجة حرارة التخزين.' } },
        { icon: 'bi-shield-check', title: 'Food Grade Materials', text: { en: 'Fully AISI 304 interior for long-term oil contact.', ar: 'داخلية من AISI 304 بالكامل لتلامس طويل الأمد مع الزيت.' } },
        { icon: 'bi-globe2', title: 'Easy Maintenance', text: { en: 'Bottom-cone drainage simplifies cleaning between fills.', ar: 'تصريف مخروطي سفلي يُسهّل التنظيف بين مرات الملء.' } },
      ],
      applications: [{ en: 'Long-Term Preservation', ar: 'حفظ طويل الأمد' }, { en: 'Bulk Oil Storage', ar: 'تخزين زيت بالجملة' }, { en: 'Pre-Shipment Holding', ar: 'حفظ ما قبل الشحن' }],
    },
    {
      id: 'nitrogen-inertization-system',
      title: { en: 'Nitrogen Inertization System', ar: 'نظام الخمول بالنيتروجين' },
      category: 'pickle-mixing-line',
      categoryLabel: { en: 'Pickle Mixing Line', ar: 'خط خلط المخللات' },
      status: { en: 'New', ar: 'جديد' },
      image: 'assets/images/machine-decanting-focused.jpg',
      alt: 'Nitrogen blanketing system protecting stored olive oil from oxidation',
      description: { en: 'Automated nitrogen blanketing that shields stored oil from oxygen throughout its shelf life.', ar: 'تغطية آلية بالنيتروجين تحمي الزيت المخزَّن من الأكسجين طوال مدة التخزين.' },
      longDescription: { en: 'This system continuously monitors headspace oxygen levels across every connected tank and doses nitrogen automatically to maintain an inert blanket, protecting stored oil from oxidation without requiring operator intervention.', ar: 'يراقب هذا النظام باستمرار مستويات الأكسجين في الفراغ العلوي لكل خزان متصل، ويضخ النيتروجين تلقائيًا للحفاظ على غطاء خامل، ما يحمي الزيت المخزَّن من الأكسدة دون الحاجة لتدخل المشغل.' },
      icons: ['bi-shield-check', 'bi-cpu-fill', 'bi-droplet-half'],
      badges: ['Automation', 'Energy Efficient', 'Export Ready'],
      images: ['assets/images/machine-decanting-focused.jpg', 'assets/images/insight-waste-recovery.jpg'],
      availability: { en: 'Made to Order', ar: 'يُصنّع حسب الطلب' },
      exportReady: true,
      warranty: { en: '24-Month Warranty', ar: 'ضمان 24 شهرًا' },
      specifications: [
        { label: 'Automation Level', value: 'Fully Automatic' },
        { label: 'Power', value: '3.2 kW' },
        { label: 'Material', value: 'Stainless Steel / Food-Grade Piping' },
        { label: 'Machine Type', value: 'Automated Nitrogen Blanketing' },
      ],
      features: [
        { icon: 'bi-shield-check', title: 'Automatic Operation', text: { en: 'Continuous headspace monitoring doses nitrogen as needed.', ar: 'مراقبة مستمرة للفراغ العلوي تُجرّع النيتروجين حسب الحاجة.' } },
        { icon: 'bi-cpu-fill', title: 'High Efficiency', text: { en: 'Multi-tank manifold control from a single PLC station.', ar: 'تحكم في عدة خزانات من محطة PLC واحدة.' } },
        { icon: 'bi-droplet-half', title: 'Low Energy Consumption', text: { en: 'On-demand dosing minimizes nitrogen consumption.', ar: 'تجريع عند الطلب يقلل استهلاك النيتروجين.' } },
        { icon: 'bi-globe2', title: 'Industrial Durability', text: { en: 'Corrosion-resistant piping rated for continuous duty.', ar: 'أنابيب مقاومة للتآكل معتمدة للعمل المستمر.' } },
      ],
      applications: [{ en: 'Oxidation Prevention', ar: 'منع الأكسدة' }, { en: 'Multi-Tank Blanketing', ar: 'تغطية عدة خزانات' }, { en: 'Shelf-Life Extension', ar: 'إطالة مدة الصلاحية' }],
    },
    {
      id: 'filling-line',
      title: { en: 'Automatic Filling Line', ar: 'خط التعبئة الآلي' },
      category: 'filling-pasteurization-line',
      categoryLabel: { en: 'Filling & Pasteurization Line', ar: 'خط التعبئة والبسترة' },
      featured: true,
      status: { en: 'Best Seller', ar: 'الأكثر مبيعًا' },
      image: 'assets/images/machine-washing.jpg',
      alt: 'Automatic volumetric filling line for bottles and tins',
      description: { en: 'Volumetric and weight-based filling systems for glass and tin containers.', ar: 'أنظمة تعبئة حجمية ووزنية للحاويات الزجاجية والمعدنية.' },
      longDescription: { en: 'A flexible volumetric and weight-based filling platform handles glass bottles, tins, and PET containers on the same line with quick-changeover tooling — ideal for producers running multiple SKUs through one packaging hall.', ar: 'منصة تعبئة حجمية ووزنية مرنة تتعامل مع الزجاجات والعلب المعدنية وحاويات PET على نفس الخط بأدوات تبديل سريع — مثالية للمصنّعين الذين يشغّلون عدة منتجات على خط تعبئة واحد.' },
      icons: ['bi-speedometer2', 'bi-cpu-fill', 'bi-shield-check'],
      badges: ['Automation', 'Capacity', 'Export Ready'],
      images: ['assets/images/machine-washing.jpg', 'assets/images/case-andalusia.jpg', 'assets/images/machine-milling.jpg'],
      availability: { en: 'In Stock', ar: 'متوفر بالمخزون' },
      exportReady: true,
      warranty: { en: '24-Month Warranty', ar: 'ضمان 24 شهرًا' },
      specifications: [
        { label: 'Capacity', value: '2,000 – 6,000 bottles/h' },
        { label: 'Power', value: '9 kW' },
        { label: 'Automation Level', value: 'Fully Automatic' },
        { label: 'Material', value: 'Stainless Steel Contact Parts' },
        { label: 'Voltage', value: '380V / 50Hz, 3-Phase' },
      ],
      features: [
        { icon: 'bi-speedometer2', title: 'High Efficiency', text: { en: 'Quick-changeover tooling switches container formats fast.', ar: 'أدوات تبديل سريع تُغيّر أشكال الحاويات بسرعة.' } },
        { icon: 'bi-cpu-fill', title: 'Automatic Operation', text: { en: 'Volumetric and weight-fill modes selectable per SKU.', ar: 'أوضاع تعبئة حجمية ووزنية قابلة للاختيار لكل منتج.' } },
        { icon: 'bi-shield-check', title: 'Food Grade Materials', text: { en: 'Stainless contact parts throughout the filling head.', ar: 'أجزاء تلامس من الفولاذ المقاوم للصدأ في رأس التعبئة بالكامل.' } },
        { icon: 'bi-tools', title: 'Easy Maintenance', text: { en: 'Tool-free nozzle swaps reduce changeover downtime.', ar: 'تبديل فوهات دون أدوات يقلل توقف التحويل.' } },
        { icon: 'bi-gem', title: 'Industrial Durability', text: { en: 'Rated for multi-shift, high-volume bottling runs.', ar: 'معتمدة لتشغيلات تعبئة عالية الحجم ومتعددة الورديات.' } },
      ],
      applications: [{ en: 'Bottle & Tin Filling', ar: 'تعبئة الزجاجات والعلب' }, { en: 'Multi-SKU Packaging', ar: 'تعبئة متعددة المنتجات' }, { en: 'Volumetric & Weight Fill', ar: 'تعبئة حجمية ووزنية' }],
    },
    {
      id: 'capping-machine',
      title: { en: 'Bottle Capping Machine', ar: 'آلة تغطية الزجاجات' },
      category: 'filling-pasteurization-line',
      categoryLabel: { en: 'Filling & Pasteurization Line', ar: 'خط التعبئة والبسترة' },
      image: 'assets/images/machine-milling.jpg',
      alt: 'Multi-head bottle capping machine',
      description: { en: 'Multi-head capping stations for screw-caps, T-corks, and pressure caps.', ar: 'محطات تغطية متعددة الرؤوس للأغطية اللولبية والفلينية وأغطية الضغط.' },
      longDescription: { en: 'Multi-head capping stations apply screw-caps, T-corks, or pressure caps with consistent, adjustable torque — synchronized directly to the filling line so bottles are sealed the instant they leave the filler.', ar: 'تُركّب محطات التغطية متعددة الرؤوس الأغطية اللولبية أو الفلينية أو أغطية الضغط بعزم دوران ثابت وقابل للتعديل — متزامنة مباشرة مع خط التعبئة بحيث تُغلق الزجاجات فور خروجها من ماكينة التعبئة.' },
      icons: ['bi-gear', 'bi-cpu-fill', 'bi-shield-check'],
      badges: ['Automation', 'Material', 'Capacity'],
      images: ['assets/images/machine-milling.jpg', 'assets/images/machine-decanting.jpg'],
      availability: { en: 'In Stock', ar: 'متوفر بالمخزون' },
      exportReady: false,
      warranty: { en: '18-Month Warranty', ar: 'ضمان 18 شهرًا' },
      specifications: [
        { label: 'Capacity', value: 'Up to 5,000 bottles/h' },
        { label: 'Power', value: '4 kW' },
        { label: 'Automation Level', value: 'Fully Automatic' },
        { label: 'Machine Type', value: 'Multi-Head Capping Station' },
      ],
      features: [
        { icon: 'bi-gear', title: 'High Efficiency', text: { en: 'Multiple capping heads run in parallel for high throughput.', ar: 'رؤوس تغطية متعددة تعمل بالتوازي لإنتاجية عالية.' } },
        { icon: 'bi-cpu-fill', title: 'Automatic Operation', text: { en: 'Adjustable torque presets per cap type, saved per SKU.', ar: 'إعدادات عزم دوران قابلة للتعديل لكل نوع غطاء، محفوظة لكل منتج.' } },
        { icon: 'bi-shield-check', title: 'Food Grade Materials', text: { en: 'Stainless chuck heads rated for direct cap contact.', ar: 'رؤوس قابضة من الفولاذ المقاوم للصدأ معتمدة لتلامس الغطاء المباشر.' } },
        { icon: 'bi-tools', title: 'Easy Maintenance', text: { en: 'Modular head cartridges swap out in minutes.', ar: 'خراطيش رؤوس معيارية تُستبدل خلال دقائق.' } },
      ],
      applications: [{ en: 'Screw-Cap Sealing', ar: 'إغلاق بغطاء لولبي' }, { en: 'T-Cork Application', ar: 'تركيب غطاء فليني' }, { en: 'Pressure Cap Sealing', ar: 'إغلاق بغطاء ضغط' }],
    },
    {
      id: 'labeling-machine',
      title: { en: 'Labeling Machine', ar: 'آلة وضع الملصقات' },
      category: 'filling-pasteurization-line',
      categoryLabel: { en: 'Filling & Pasteurization Line', ar: 'خط التعبئة والبسترة' },
      image: 'assets/images/machine-decanting.jpg',
      alt: 'High-speed adhesive labeling machine with vision check',
      description: { en: 'High-speed adhesive labeling with precise orientation and vision check.', ar: 'وضع ملصقات لاصقة عالية السرعة بتوجيه دقيق وفحص بصري.' },
      longDescription: { en: 'High-speed adhesive labeling applies front, back, and neck labels with precise orientation, backed by an inline vision check that rejects any bottle with a misaligned or missing label before it reaches the case packer.', ar: 'تضع آلة الملصقات اللاصقة عالية السرعة الملصقات الأمامية والخلفية وملصق الرقبة بتوجيه دقيق، مدعومة بفحص بصري مباشر يرفض أي زجاجة ذات ملصق غير محاذٍ أو مفقود قبل وصولها إلى مكبس التعبئة.' },
      icons: ['bi-tag', 'bi-eye', 'bi-shield-check'],
      badges: ['Automation', 'Export Ready', 'Capacity'],
      images: ['assets/images/machine-decanting.jpg', 'assets/images/case-florence.jpg', 'assets/images/insight-modular-series.jpg'],
      availability: { en: 'In Stock', ar: 'متوفر بالمخزون' },
      exportReady: true,
      warranty: { en: '18-Month Warranty', ar: 'ضمان 18 شهرًا' },
      specifications: [
        { label: 'Capacity', value: 'Up to 6,000 bottles/h' },
        { label: 'Power', value: '3.5 kW' },
        { label: 'Automation Level', value: 'Fully Automatic' },
        { label: 'Machine Type', value: 'Vision-Checked Adhesive Labeler' },
      ],
      features: [
        { icon: 'bi-tag', title: 'High Efficiency', text: { en: 'Front, back, and neck labels applied in a single pass.', ar: 'توضع الملصقات الأمامية والخلفية وملصق الرقبة في مرور واحد.' } },
        { icon: 'bi-eye', title: 'Automatic Operation', text: { en: 'Inline vision check rejects misaligned labels automatically.', ar: 'فحص بصري مباشر يرفض الملصقات غير المحاذاة تلقائيًا.' } },
        { icon: 'bi-shield-check', title: 'Industrial Durability', text: { en: 'Continuous-duty servo drives for long labeling runs.', ar: 'محركات سيرفو للعمل المستمر لتشغيلات وضع ملصقات طويلة.' } },
        { icon: 'bi-globe2', title: 'Easy Maintenance', text: { en: 'Quick-load label reels minimize changeover time.', ar: 'بكرات ملصقات سريعة التحميل تقلل وقت التحويل.' } },
      ],
      applications: [{ en: 'Front & Back Labeling', ar: 'وضع ملصق أمامي وخلفي' }, { en: 'Neck Label Application', ar: 'وضع ملصق الرقبة' }, { en: 'Vision-Checked Quality Control', ar: 'مراقبة جودة بالفحص البصري' }],
    },
    {
      id: 'packaging-line',
      title: { en: 'Packaging Line', ar: 'خط التغليف' },
      category: 'filling-pasteurization-line',
      categoryLabel: { en: 'Filling & Pasteurization Line', ar: 'خط التعبئة والبسترة' },
      image: 'assets/images/case-andalusia.jpg',
      alt: 'End-of-line case packing and palletizing system',
      description: { en: 'End-of-line case packing and palletizing for global distribution logistics.', ar: 'تعبئة الكراتين وتجهيز المنصات في نهاية الخط لخدمات التوزيع العالمي.' },
      longDescription: { en: 'The end-of-line cell case-packs finished bottles and builds pallets ready for global distribution — sized to match upstream filling and labeling throughput so nothing bottlenecks before the truck.', ar: 'تقوم الوحدة النهائية للخط بتعبئة الزجاجات الجاهزة في الكراتين وبناء المنصات الجاهزة للتوزيع العالمي — بحجم متوافق مع طاقة التعبئة ووضع الملصقات في المراحل السابقة بحيث لا تحدث أي اختناقات قبل الشحن.' },
      icons: ['bi-box-seam', 'bi-truck', 'bi-shield-check'],
      badges: ['Capacity', 'Export Ready', 'Automation'],
      images: ['assets/images/case-andalusia.jpg', 'assets/images/machine-washing.jpg'],
      availability: { en: 'Made to Order', ar: 'يُصنّع حسب الطلب' },
      exportReady: true,
      warranty: { en: '24-Month Warranty', ar: 'ضمان 24 شهرًا' },
      specifications: [
        { label: 'Capacity', value: 'Up to 20 cases/min' },
        { label: 'Power', value: '7.5 kW' },
        { label: 'Automation Level', value: 'Fully Automatic' },
        { label: 'Machine Type', value: 'Case Packer & Palletizer' },
      ],
      features: [
        { icon: 'bi-box-seam', title: 'High Efficiency', text: { en: 'Matched to upstream filling and labeling throughput.', ar: 'متوافقة مع إنتاجية التعبئة ووضع الملصقات السابقة.' } },
        { icon: 'bi-truck', title: 'Automatic Operation', text: { en: 'Robotic palletizing builds export-ready pallet patterns.', ar: 'تكديس آلي يبني أنماط منصات جاهزة للتصدير.' } },
        { icon: 'bi-shield-check', title: 'Industrial Durability', text: { en: 'Heavy-duty frame rated for continuous shift operation.', ar: 'إطار للخدمة الشاقة معتمد للتشغيل المستمر بالورديات.' } },
        { icon: 'bi-globe2', title: 'Easy Maintenance', text: { en: 'Standardized case formats simplify changeovers.', ar: 'أشكال كراتين موحدة تُسهّل عمليات التحويل.' } },
      ],
      applications: [{ en: 'Case Packing', ar: 'تعبئة الكراتين' }, { en: 'Robotic Palletizing', ar: 'تكديس آلي' }, { en: 'Export Logistics Prep', ar: 'تجهيز لوجستيات التصدير' }],
    },
    {
      id: 'continuous-roasting-oven',
      title: { en: 'Continuous Roasting Oven', ar: 'فرن التحميص المستمر' },
      category: 'roasting-line',
      categoryLabel: { en: 'Roasting Line', ar: 'خط التحميص' },
      featured: true,
      status: { en: 'Best Seller', ar: 'الأكثر مبيعًا' },
      image: 'assets/images/insight-ai-pressing.jpg',
      alt: 'PITEX continuous roasting oven with a tumbling drum chamber',
      description: { en: 'A continuous-flow roasting oven with a tumbling drum chamber, built for consistent color and flavor at high throughput.', ar: 'فرن تحميص بتدفق مستمر وأسطوانة دوّارة، مصمم للحصول على لون ونكهة ثابتين بإنتاجية عالية.' },
      longDescription: { en: 'Product moves continuously through a temperature-controlled tumbling drum, so every batch receives the same heat exposure from entry to exit. Programmable time-and-temperature profiles let a single oven hold a repeatable roast across different products and run lengths.', ar: 'يتحرك المنتج باستمرار عبر أسطوانة دوّارة بتحكم حراري، بحيث تتلقى كل دفعة نفس درجة التعرض للحرارة من الدخول وحتى الخروج. تتيح الملفات القابلة للبرمجة للوقت ودرجة الحرارة لفرن واحد الحفاظ على تحميص ثابت عبر منتجات مختلفة وأطوال تشغيل متنوعة.' },
      icons: ['bi-fire', 'bi-cpu-fill', 'bi-shield-check'],
      badges: ['Automation', 'Energy Efficient'],
      images: ['assets/images/insight-ai-pressing.jpg', 'assets/images/machine-3-BclqmCUT.jpg'],
      availability: { en: 'Made to Order', ar: 'يُصنّع حسب الطلب' },
      exportReady: true,
      warranty: { en: '36-Month Warranty', ar: 'ضمان 36 شهرًا' },
      specifications: [
        { label: 'Capacity', value: '2,000 – 4,000 kg/h' },
        { label: 'Automation Level', value: 'Fully Automatic, PLC-Integrated' },
        { label: 'Material', value: 'AISI 304 / 316 Stainless Steel' },
        { label: 'Machine Type', value: 'Continuous Roasting Oven' },
        { label: 'Country of Installation', value: 'Global — On-Site Commissioning' },
      ],
      features: [
        { icon: 'bi-fire', title: 'Even Heat Distribution', text: { en: 'Tumbling drum brings heat evenly to every surface.', ar: 'أسطوانة دوّارة توصل الحرارة بالتساوي إلى كل سطح.' } },
        { icon: 'bi-cpu-fill', title: 'Automatic Operation', text: { en: 'PLC-controlled time-and-temperature profiles repeat on demand.', ar: 'مسارات وقت ودرجة حرارة يتحكم بها PLC تتكرر عند الطلب.' } },
        { icon: 'bi-shield-check', title: 'Food Grade Materials', text: { en: 'Full stainless construction throughout the chamber.', ar: 'بناء بالكامل من الفولاذ المقاوم للصدأ داخل الغرفة.' } },
        { icon: 'bi-lightning-charge', title: 'Low Energy Consumption', text: { en: 'Recovered heat lowers energy use on long roasting runs.', ar: 'الحرارة المسترجعة تقلل استهلاك الطاقة في عمليات التحميص الطويلة.' } },
        { icon: 'bi-globe2', title: 'Industrial Durability', text: { en: 'Heavy-duty frame rated for continuous shift operation.', ar: 'إطار للخدمة الشاقة معتمد للتشغيل المستمر بالورديات.' } },
      ],
      applications: [{ en: 'High-Volume Roasting', ar: 'تحميص عالي الحجم' }, { en: 'Continuous-Flow Processing', ar: 'معالجة بتدفق مستمر' }, { en: 'Consistent Color & Flavor', ar: 'لون ونكهة ثابتان' }],
    },
    {
      id: 'batch-roasting-drum',
      title: { en: 'Batch Roasting Drum', ar: 'أسطوانة التحميص بالدفعات' },
      category: 'roasting-line',
      categoryLabel: { en: 'Roasting Line', ar: 'خط التحميص' },
      status: { en: 'New', ar: 'جديد' },
      image: 'assets/images/insight-modular-series.jpg',
      alt: 'Compact PITEX batch roasting drum for boutique production',
      description: { en: 'A compact, right-sized roasting drum built for boutique batches and satellite production sites.', ar: 'أسطوانة تحميص مدمجة بحجم مناسب للدفعات الصغيرة ومواقع الإنتاج الفرعية.' },
      longDescription: { en: 'A pre-engineered, space-saving roasting drum sized for boutique-scale runs, delivered as a self-contained skid for fast on-site setup. Saved time-and-temperature presets repeat the same roast on demand, even at small batch sizes.', ar: 'أسطوانة تحميص مصممة مسبقًا وموفرة للمساحة، بحجم مناسب لدفعات صغيرة الحجم، تُسلَّم كوحدة زلاجة متكاملة لتركيب سريع في الموقع. تتيح إعدادات الوقت ودرجة الحرارة المحفوظة تكرار نفس درجة التحميص عند الطلب، حتى بأحجام دفعات صغيرة.' },
      icons: ['bi-fire', 'bi-speedometer2', 'bi-shield-check'],
      badges: ['Capacity', 'Energy Efficient'],
      images: ['assets/images/insight-modular-series.jpg', 'assets/images/machine-decanting-focused.jpg'],
      availability: { en: 'In Stock', ar: 'متوفر بالمخزون' },
      exportReady: true,
      warranty: { en: '24-Month Warranty', ar: 'ضمان 24 شهرًا' },
      specifications: [
        { label: 'Capacity', value: '800 – 2,000 kg/h' },
        { label: 'Automation Level', value: 'Semi-Automatic' },
        { label: 'Material', value: 'AISI 304 Stainless Steel' },
        { label: 'Dimensions', value: 'Self-contained skid, 20ft container-ready' },
        { label: 'Machine Type', value: 'Batch Roasting Drum' },
      ],
      features: [
        { icon: 'bi-fire', title: 'Even Heat Distribution', text: { en: 'Drum rotation brings heat evenly to every batch.', ar: 'دوران الأسطوانة يوصل الحرارة بالتساوي إلى كل دفعة.' } },
        { icon: 'bi-speedometer2', title: 'Low Energy Consumption', text: { en: 'Right-sized burner matched to boutique-scale throughput.', ar: 'حارق بالحجم المناسب يتوافق مع إنتاجية النطاق الصغير.' } },
        { icon: 'bi-shield-check', title: 'Food Grade Materials', text: { en: 'Full stainless construction despite the compact footprint.', ar: 'بناء بالكامل من الفولاذ المقاوم للصدأ رغم المساحة المدمجة.' } },
        { icon: 'bi-truck', title: 'Easy Maintenance', text: { en: 'Container-ready skid simplifies shipping and relocation.', ar: 'زلاجة جاهزة للحاويات تُسهّل الشحن والنقل.' } },
      ],
      applications: [{ en: 'Boutique-Batch Roasting', ar: 'تحميص دفعات بوتيكية' }, { en: 'Satellite Site Production', ar: 'إنتاج في موقع فرعي' }, { en: 'Space-Constrained Sites', ar: 'مواقع محدودة المساحة' }],
    },
  ];

  /**
   * The one place product-card HTML is authored. index.html and
   * products.html both call this — never write out card markup by hand
   * on either page.
   *
   * @param {object} p    product record from `data`
   * @param {object} opts { ctaLabel: string, showBadges: boolean }
   */
  function renderProductCard(p, opts) {
    const options = Object.assign({ ctaLabel: 'Learn More', showBadges: false }, opts || {});
    const pick = window.I18N && window.I18N.pick ? window.I18N.pick : (v) => (typeof v === 'string' ? v : v.en);

    const title = pick(p.title);
    const categoryLabel = pick(p.categoryLabel);
    const description = pick(p.description);

    const featuredBadge = p.featured
      ? '<span class="product-badge product-badge--featured" data-i18n="common.misc.featured">Featured</span>'
      : '';
    const icons = (p.icons || [])
      .map((ic) => '<span class="product-icon" aria-hidden="true"><i class="bi ' + ic + '"></i></span>')
      .join('');

    const featureBadges = options.showBadges && (p.badges || []).length
      ? '<div class="product-feature-badges" aria-hidden="false">' + (p.badges || [])
          .map((b) => '<span class="feature-badge"><i class="bi ' + (BADGE_ICONS[b] || 'bi-check-circle') + '" aria-hidden="true"></i>' + labelFor(BADGE_LABELS, b) + '</span>')
          .join('') + '</div>'
      : '';

    // data-product-id lets I18N re-render this exact card's text after a
    // language switch without a full re-render of the whole grid — see
    // wireProductCards()/I18N.onChange() below.
    return '\n      <div class="col-12 col-sm-6 col-lg-4">\n' +
      '        <article class="product-card gsap-stagger-item" data-category="' + p.category + '" data-product-id="' + p.id + '">\n' +
      '          <div class="product-card__media">\n' +
      '            <img src="' + p.image + '" alt="' + title + '" loading="lazy" width="600" height="450" />\n' +
      '            <div class="product-overlay" aria-hidden="true"></div>\n' +
      '            <div class="card-sweep" aria-hidden="true"></div>\n' +
      '            ' + featuredBadge + '\n' +
      '            <button type="button" class="product-favorite" data-favorite aria-pressed="false" aria-label="Save ' + title + ' to favorites">\n' +
      '              <i class="bi bi-heart" aria-hidden="true"></i>\n' +
      '            </button>\n' +
      '          </div>\n' +
      '          <div class="product-card__body">\n' +
      '            <span class="eyebrow product-category">' + categoryLabel + '</span>\n' +
      '            <h3 class="product-title">' + title + '</h3>\n' +
      '            <p class="product-text">' + description + '</p>\n' +
      '            ' + featureBadges + '\n' +
      '            <div class="product-card__footer">\n' +
      '              <div class="product-icons" aria-hidden="true">' + icons + '</div>\n' +
      '              <a href="#" class="link-arrow product-link" data-product-link data-product-id="' + p.id + '">\n' +
      '                ' + options.ctaLabel + '\n' +
      '                <i class="bi bi-arrow-right" aria-hidden="true" data-rtl-flip></i>\n' +
      '              </a>\n' +
      '            </div>\n' +
      '          </div>\n' +
      '        </article>\n' +
      '      </div>';
  }

  function byCategory(slug) {
    return data.filter((p) => p.category === slug);
  }

  /**
   * A handful of products from OTHER categories, for the "Related
   * Products" rail on products.html. Featured items first so the rail
   * always leads with a strong image.
   */
  function getRelatedProducts(slug, limit) {
    const n = limit || 3;
    const others = data.filter((p) => p.category !== slug);
    const featured = others.filter((p) => p.featured);
    const rest = others.filter((p) => !p.featured);
    return featured.concat(rest).slice(0, n);
  }

  /** Single product lookup by id — the whole Product Details page hangs off this. */
  function getProductById(id) {
    return data.find((p) => p.id === id) || null;
  }

  /**
   * Products from the SAME category as `id`, for the Product Details
   * "Related Products" rail (excludes the product itself). Tops up from
   * the rest of the catalog if the category is too small to fill `limit`,
   * so the rail is never left half-empty on a small category.
   */
  function getSameCategoryProducts(id, limit) {
    const n = limit || 3;
    const current = getProductById(id);
    if (!current) return [];
    const sameCategory = data.filter((p) => p.id !== id && p.category === current.category);
    if (sameCategory.length >= n) return sameCategory.slice(0, n);
    const filler = getRelatedProducts(current.category, n - sameCategory.length)
      .filter((p) => p.id !== id);
    return sameCategory.concat(filler).slice(0, n);
  }

  /**
   * Shared hover/tilt interaction + favorite-toggle wiring for any grid
   * of `.product-card`s, however it was rendered. Used by the homepage
   * preview (production-lines.js) and the category grid + related rail
   * (products.js) so this recipe exists in exactly one place.
   */
  function wireProductCards(grid) {
    if (!grid) return;

    grid.querySelectorAll('[data-favorite]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const active = btn.classList.toggle('is-active');
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || typeof gsap === 'undefined') return;

    grid.querySelectorAll('.product-card').forEach((card) => {
      const img = card.querySelector('.product-card__media img');
      gsap.set(card, { transformPerspective: 1000, transformOrigin: 'center' });

      const liftTo = gsap.quickTo(card, 'y', { duration: 0.8, ease: 'power3.out' });
      const imgScaleTo = img ? gsap.quickTo(img, 'scale', { duration: 1, ease: 'power3.out' }) : null;

      card.addEventListener('mouseenter', () => {
        liftTo(-10);
        if (imgScaleTo) imgScaleTo(1.1);
      });
      card.addEventListener('mouseleave', () => {
        liftTo(0);
        if (imgScaleTo) imgScaleTo(1);
      });
    });
  }

  return {
    data,
    BADGE_ICONS,
    SPEC_ICONS,
    BADGE_LABELS,
    SPEC_LABELS,
    FEATURE_LABELS,
    labelFor,
    renderProductCard,
    byCategory,
    getRelatedProducts,
    getProductById,
    getSameCategoryProducts,
    wireProductCards,
  };
})();
