/* =========================================================================
   PITEX — categories-data.js
   Single source of truth for the SIX production-line categories. Both
   production-lines.html (category grid) and products.html (template —
   reads the category from the URL) render from `data` here through the
   same `renderCategoryCard()` function. Product counts are derived live
   from `window.PitexProducts.data` (products-data.js) so the two files
   never fall out of sync — nothing here hard-codes a count.
   ========================================================================= */

window.PitexCategories = (function () {
  'use strict';

  const data = [
    {
      slug: 'pitting-slicing-line',
      label: { en: 'Pitting & Slicing Line', ar: 'خط الخلي والشرائح ' },
      icon: 'bi-scissors',
      image: 'assets/images/machine-milling.jpg',
      alt: 'PITEX pitting and slicing line preparing olives for packing',
      shortDesc: { en: 'High-precision pitting and slicing systems that prepare whole olives for pitted, sliced and wedge-cut product lines without damaging the fruit.', ar: 'أنظمة نزع نوى وتقطيع عالية الدقة تُجهّز حبات الزيتون الكاملة لخطوط المنتجات المنزوعة النوى والمقطعة والمقطعة على شكل أسافين دون الإضرار بالثمرة.' },
      heroDesc: { en: 'Automated pitting and slicing engineered for consistent cut quality at scale — the stage that turns whole olives into pitted, sliced and wedge-cut product ready for packing.', ar: 'نزع نوى وتقطيع آلي مصمم لجودة قطع ثابتة على نطاق واسع — المرحلة التي تحوّل حبات الزيتون الكاملة إلى منتج منزوع النوى ومقطع وعلى شكل أسافين جاهز للتعبئة.' },
      overviewDesc: { en: 'Each unit combines precision pit-extraction heads with interchangeable slicing blades, so a single line can switch between pitted, sliced and wedge formats with minimal changeover. Fruit is gently guided through every stage to protect texture and appearance in the finished product.', ar: 'تجمع كل وحدة بين رؤوس نزع نوى دقيقة وشفرات تقطيع قابلة للتبديل، بحيث يمكن لخط واحد التبديل بين أشكال منزوعة النوى والمقطعة والأسافين بأقل وقت تحويل. تُوجَّه الثمار برفق عبر كل مرحلة للحفاظ على القوام والمظهر في المنتج النهائي.' },
      applications: [
        { icon: 'bi-scissors', title: { en: 'Pit Extraction', ar: 'نزع النوى' }, text: { en: 'Precision heads remove pits cleanly with minimal fruit loss.', ar: 'تزيل الرؤوس الدقيقة النوى بنظافة وبأقل قدر من فقد الثمار.' } },
        { icon: 'bi-grid-3x3-gap', title: { en: 'Uniform Slicing', ar: 'تقطيع منتظم' }, text: { en: 'Interchangeable blades deliver consistent slice or wedge cuts.', ar: 'توفر الشفرات القابلة للتبديل قطعًا منتظمًا شرائح أو أسافين.' } },
        { icon: 'bi-arrow-repeat', title: { en: 'Format Changeover', ar: 'تبديل الشكل' }, text: { en: 'Quick tooling swaps switch between pitted, sliced and wedge runs.', ar: 'تبديل سريع للأدوات للتنقل بين تشغيلات منزوعة النوى والمقطعة والأسافين.' } },
      ],
      advantages: [
        { icon: 'bi-shield-check', title: { en: 'Consistent Cut Quality', ar: 'جودة قطع ثابتة' }, text: { en: 'Every olive receives the same precise pit-extraction and cut.', ar: 'تحصل كل حبة زيتون على نفس عملية نزع النواة والقطع الدقيقة.' } },
        { icon: 'bi-droplet-half', title: { en: 'Minimal Fruit Damage', ar: 'أقل ضرر للثمار' }, text: { en: 'Gentle guide paths protect texture and finished appearance.', ar: 'مسارات توجيه لطيفة تحافظ على القوام والمظهر النهائي.' } },
        { icon: 'bi-speedometer2', title: { en: 'Fast Format Switching', ar: 'تبديل سريع للشكل' }, text: { en: 'Change product formats without long production stops.', ar: 'تغيير أشكال المنتج دون توقفات إنتاج طويلة.' } },
      ],
      capacity: '1,500 – 6,000 kg/h',
      badges: ['Automation', 'Capacity'],
    },
    {
      slug: 'olive-grading-line',
      label: { en: 'Olive Grading Line (Standard Olive Sizing)', ar: 'خط التدريج  (تحجيم الزيتون)' },
      icon: 'bi-funnel',
      image: 'assets/images/machine-washing.jpg',
      alt: 'Olives moving through the PITEX automated grading and sizing line',
      shortDesc: { en: 'Calibrated sizing and grading systems that sort olives by diameter into standard commercial size classes before further processing.', ar: 'أنظمة تدريج وفرز معايرة تُصنّف الزيتون حسب القطر إلى فئات حجم تجارية قياسية قبل المعالجة اللاحقة.' },
      heroDesc: { en: 'Precision calibration that sorts every olive into standard size classes — the grading stage that keeps downstream pitting, stuffing and packing runs consistent batch after batch.', ar: 'معايرة دقيقة تُصنّف كل حبة زيتون ضمن فئات حجم قياسية — مرحلة الفرز التي تحافظ على ثبات عمليات نزع النوى والحشو والتعبئة اللاحقة دفعة بعد دفعة.' },
      overviewDesc: { en: 'Olives pass across calibrated sizing rollers and inspection stations that sort fruit into standard commercial size classes, with adjustable grading bands to match regional or customer specifications. Consistent sizing keeps every downstream stage — pitting, stuffing, packing — running on uniform fruit.', ar: 'يمر الزيتون عبر بكرات تدريج معايرة ومحطات فحص تُصنّف الثمار إلى فئات حجم تجارية قياسية، مع نطاقات فرز قابلة للتعديل لتتوافق مع المواصفات الإقليمية أو مواصفات العميل. يحافظ التدريج الثابت على عمل كل مرحلة لاحقة — نزع النوى والحشو والتعبئة — على ثمار موحدة الحجم.' },
      applications: [
        { icon: 'bi-rulers', title: { en: 'Diameter Calibration', ar: 'معايرة القطر' }, text: { en: 'Calibrated rollers sort fruit precisely by size.', ar: 'تفرز البكرات المعايرة الثمار بدقة حسب الحجم.' } },
        { icon: 'bi-funnel', title: { en: 'Size-Class Sorting', ar: 'فرز حسب فئة الحجم' }, text: { en: 'Fruit is routed into standard commercial size classes.', ar: 'تُوجَّه الثمار إلى فئات حجم تجارية قياسية.' } },
        { icon: 'bi-sliders', title: { en: 'Grading Band Adjustment', ar: 'ضبط نطاق الفرز' }, text: { en: 'Size bands adjust to regional or customer specifications.', ar: 'تُضبط نطاقات الحجم وفق المواصفات الإقليمية أو مواصفات العميل.' } },
      ],
      advantages: [
        { icon: 'bi-shield-check', title: { en: 'Consistent Batch Uniformity', ar: 'تجانس ثابت للدفعات' }, text: { en: 'Every batch leaves the line within the same size class.', ar: 'تخرج كل دفعة من الخط ضمن فئة الحجم نفسها.' } },
        { icon: 'bi-arrow-repeat', title: { en: 'Adjustable Size Classes', ar: 'فئات حجم قابلة للتعديل' }, text: { en: 'Grading bands reconfigure for different specifications.', ar: 'يُعاد ضبط نطاقات الفرز لمواصفات مختلفة.' } },
        { icon: 'bi-speedometer2', title: { en: 'Faster Downstream Processing', ar: 'معالجة لاحقة أسرع' }, text: { en: 'Uniform fruit keeps pitting and packing lines running smoothly.', ar: 'تحافظ الثمار الموحدة على سير خطي نزع النوى والتعبئة بسلاسة.' } },
      ],
      capacity: '3,000 – 10,000 kg/h',
      badges: ['Automation', 'Material'],
    },
    {
      slug: 'filling-pasteurization-line',
      label: { en: 'Filling & Pasteurization Line', ar: 'خط التعبئة والبسترة' },
      icon: 'bi-thermometer-half',
      image: 'assets/images/case-andalusia.jpg',
      alt: 'Automated PITEX filling and pasteurization line',
      shortDesc: { en: 'Synchronized filling and pasteurization systems that seal in freshness and extend shelf life for jarred and bottled product.', ar: 'أنظمة تعبئة وبسترة متزامنة تحافظ على الطزاجة وتطيل مدة الصلاحية للمنتجات المعبأة في برطمانات وزجاجات.' },
      heroDesc: { en: 'Filling and heat treatment synchronized into one continuous line — product moves from container fill to full pasteurization without a manual handoff.', ar: 'تعبئة ومعالجة حرارية متزامنتان في خط مستمر واحد — ينتقل المنتج من تعبئة الحاوية إلى البسترة الكاملة دون أي تدخل يدوي.' },
      overviewDesc: { en: 'Volumetric or weight-based filling heads dose brine, oil or liquid product into jars and bottles, which then move directly into a controlled-temperature pasteurization tunnel. Tight process control across both stages protects flavor while meeting shelf-life and food-safety requirements.', ar: 'تُجرِّع رؤوس التعبئة الحجمية أو الوزنية المحلول الملحي أو الزيت أو المنتج السائل في البرطمانات والزجاجات، التي تنتقل بعد ذلك مباشرة إلى نفق بسترة بتحكم حراري. يحافظ التحكم الدقيق في كلتا المرحلتين على النكهة مع تلبية متطلبات مدة الصلاحية وسلامة الغذاء.' },
      applications: [
        { icon: 'bi-speedometer2', title: { en: 'Volumetric Filling', ar: 'تعبئة حجمية' }, text: { en: 'Precise dosing for jars, bottles and pouches.', ar: 'تجريع دقيق للبرطمانات والزجاجات والأكياس.' } },
        { icon: 'bi-thermometer-half', title: { en: 'Controlled-Temperature Pasteurization', ar: 'بسترة بتحكم حراري' }, text: { en: 'Tunnel processing holds a validated heat-treatment profile.', ar: 'تحافظ المعالجة النفقية على مسار معالجة حرارية معتمد.' } },
        { icon: 'bi-box-seam', title: { en: 'Container Sealing', ar: 'إحكام غلق الحاويات' }, text: { en: 'Inline capping and seal-integrity checks after filling.', ar: 'تغطية مباشرة على الخط وفحص سلامة الغلق بعد التعبئة.' } },
      ],
      advantages: [
        { icon: 'bi-shield-check', title: { en: 'Extended Shelf Life', ar: 'مدة صلاحية أطول' }, text: { en: 'Validated pasteurization profiles protect product safety.', ar: 'تحمي مسارات البسترة المعتمدة سلامة المنتج.' } },
        { icon: 'bi-cpu-fill', title: { en: 'Consistent Fill Accuracy', ar: 'دقة تعبئة ثابتة' }, text: { en: 'PLC-controlled dosing holds fill weight within tolerance.', ar: 'يحافظ التجريع بتحكم PLC على وزن التعبئة ضمن الحد المسموح.' } },
        { icon: 'bi-globe2', title: { en: 'Food-Safety Compliance', ar: 'الامتثال لسلامة الغذاء' }, text: { en: 'Process control built to meet export food-safety standards.', ar: 'تحكم في العملية مصمم لتلبية معايير سلامة الغذاء الخاصة بالتصدير.' } },
      ],
      capacity: '2,000 – 8,000 containers/h',
      badges: ['Automation', 'Export Ready'],
    },
    {
      slug: 'roasting-line',
      label: { en: 'Roasting Line', ar: 'خط الشوي' },
      icon: 'bi-fire',
      image: 'assets/images/insight-ai-pressing.jpg',
      alt: 'PITEX roasting line developing flavor and color evenly across each batch',
      shortDesc: { en: 'Controlled-temperature roasting systems that develop flavor and color evenly across every batch.', ar: 'أنظمة تحميص بتحكم حراري تُطوّر النكهة واللون بشكل متساوٍ في كل دفعة.' },
      heroDesc: { en: 'Even, controlled-temperature roasting engineered for consistent flavor and color development, batch after batch.', ar: 'تحميص متساوٍ بتحكم حراري مصمم لتطوير نكهة ولون ثابتين، دفعة بعد دفعة.' },
      overviewDesc: { en: 'Product moves through a temperature-controlled roasting chamber with continuous tumbling or conveyor motion, so heat reaches every surface evenly. Programmable time-and-temperature profiles let the same line hold a consistent roast across different products and batch sizes.', ar: 'يتحرك المنتج عبر غرفة تحميص بتحكم حراري مع حركة تقليب أو نقل مستمرة، بحيث تصل الحرارة إلى كل سطح بالتساوي. تتيح مسارات الوقت ودرجة الحرارة القابلة للبرمجة لنفس الخط الحفاظ على تحميص ثابت عبر منتجات وأحجام دفعات مختلفة.' },
      applications: [
        { icon: 'bi-fire', title: { en: 'Even Heat Distribution', ar: 'توزيع حراري متساوٍ' }, text: { en: 'Chamber design brings heat evenly to every surface.', ar: 'يوصل تصميم الغرفة الحرارة بالتساوي إلى كل سطح.' } },
        { icon: 'bi-arrow-repeat', title: { en: 'Continuous Tumbling', ar: 'تقليب مستمر' }, text: { en: 'Constant motion prevents scorching and uneven color.', ar: 'تمنع الحركة المستمرة الاحتراق واللون غير المتساوي.' } },
        { icon: 'bi-sliders', title: { en: 'Programmable Roast Profiles', ar: 'مسارات تحميص قابلة للبرمجة' }, text: { en: 'Time-and-temperature presets repeat the same roast on demand.', ar: 'تُكرر إعدادات الوقت ودرجة الحرارة المحفوظة نفس درجة التحميص عند الطلب.' } },
      ],
      advantages: [
        { icon: 'bi-shield-check', title: { en: 'Consistent Color & Flavor', ar: 'لون ونكهة ثابتان' }, text: { en: 'Every batch finishes within the same roast profile.', ar: 'تنتهي كل دفعة ضمن نفس مسار التحميص.' } },
        { icon: 'bi-arrow-repeat', title: { en: 'Batch-to-Batch Repeatability', ar: 'تكرار ثابت بين الدفعات' }, text: { en: 'Saved presets remove guesswork between runs.', ar: 'تزيل الإعدادات المحفوظة التخمين بين التشغيلات.' } },
        { icon: 'bi-lightning-charge', title: { en: 'Energy-Efficient Heat Recovery', ar: 'استرجاع حراري موفر للطاقة' }, text: { en: 'Recovered heat lowers energy use across long roasting runs.', ar: 'تقلل الحرارة المسترجعة من استهلاك الطاقة خلال عمليات التحميص الطويلة.' } },
      ],
      capacity: '800 – 4,000 kg/h',
      badges: ['Energy Efficient', 'Automation'],
    },
    {
      slug: 'pepper-cucumber-perforation-line',
      label: { en: 'Pepper & Cucumber Perforation Line', ar: 'خط تخريم الفلفل والخيار' },
      icon: 'bi-bullseye',
      image: 'assets/images/machine-3-BclqmCUT.jpg',
      alt: 'PITEX perforation line preparing peppers and cucumbers for curing',
      shortDesc: { en: 'Precision perforation systems that pierce peppers and cucumbers evenly so brine and marinade penetrate fully during curing.', ar: 'أنظمة ثقب دقيقة تخترق الفلفل والخيار بانتظام للسماح بتغلغل المحلول الملحي والتتبيلة بالكامل أثناء التخليل.' },
      heroDesc: { en: 'Uniform, precision perforation that lets brine and marinade penetrate every pepper and cucumber fully and evenly before curing.', ar: 'ثقب دقيق ومنتظم يتيح تغلغل المحلول الملحي والتتبيلة بالكامل وبالتساوي في كل حبة فلفل وخيار قبل التخليل.' },
      overviewDesc: { en: 'Fruit passes through a bank of precision needles or rollers that create a consistent perforation pattern across the skin, without crushing or splitting the product. Even perforation shortens curing time and gives a more consistent flavor absorption across the batch.', ar: 'تمر الثمار عبر مجموعة من الإبر أو البكرات الدقيقة التي تُحدث نمط ثقب منتظم عبر القشرة، دون سحق المنتج أو تشقيقه. يقصّر الثقب المتساوي مدة التخليل ويمنح امتصاصًا أكثر انتظامًا للنكهة عبر الدفعة.' },
      applications: [
        { icon: 'bi-bullseye', title: { en: 'Uniform Skin Perforation', ar: 'ثقب منتظم للقشرة' }, text: { en: 'Consistent piercing pattern across every piece.', ar: 'نمط ثقب ثابت عبر كل قطعة.' } },
        { icon: 'bi-shield-check', title: { en: 'Gentle Fruit Handling', ar: 'تعامل لطيف مع الثمار' }, text: { en: 'Product moves through without crushing or splitting.', ar: 'يمر المنتج دون سحق أو تشقيق.' } },
        { icon: 'bi-sliders', title: { en: 'Adjustable Perforation Density', ar: 'كثافة ثقب قابلة للتعديل' }, text: { en: 'Needle spacing tunes to product size and recipe.', ar: 'يُضبط تباعد الإبر حسب حجم المنتج والوصفة.' } },
      ],
      advantages: [
        { icon: 'bi-speedometer2', title: { en: 'Faster, More Even Curing', ar: 'تخليل أسرع وأكثر انتظامًا' }, text: { en: 'Perforated skin lets brine penetrate in less time.', ar: 'تسمح القشرة المثقوبة بتغلغل المحلول الملحي في وقت أقل.' } },
        { icon: 'bi-droplet-half', title: { en: 'Reduced Product Damage', ar: 'تقليل تلف المنتج' }, text: { en: 'Precise piercing avoids splitting or bruising.', ar: 'يتجنب الثقب الدقيق التشقيق أو الكدمات.' } },
        { icon: 'bi-arrow-repeat', title: { en: 'Consistent Flavor Absorption', ar: 'امتصاص نكهة ثابت' }, text: { en: 'Even perforation gives uniform taste across the batch.', ar: 'يمنح الثقب المتساوي طعمًا موحدًا عبر الدفعة.' } },
      ],
      capacity: '2,000 – 7,000 kg/h',
      badges: ['Automation', 'Material'],
    },
    {
      slug: 'pickle-mixing-line',
      label: { en: 'Pickle Mixing Line', ar: 'خط تقليب المخللات' },
      icon: 'bi-arrow-repeat',
      image: 'assets/images/insight-waste-recovery.jpg',
      alt: 'PITEX pickle mixing line blending brine to a controlled recipe',
      shortDesc: { en: 'Automated brine mixing and blending systems that deliver a consistent pickle formula to every batch.', ar: 'أنظمة خلط ومزج آلية للمحلول الملحي تُقدّم تركيبة مخلل ثابتة لكل دفعة.' },
      heroDesc: { en: 'Automated brine mixing that holds the same salt, acid and spice formula batch after batch — the stage that keeps every jar tasting the same.', ar: 'خلط آلي للمحلول الملحي يحافظ على نفس تركيبة الملح والحمض والتوابل دفعة بعد دفعة — المرحلة التي تجعل طعم كل برطمان متطابقًا.' },
      overviewDesc: { en: 'Ingredients are dosed and blended in a stainless mixing vessel with recipe-controlled ratios of brine, salt, acid and spice, then held under gentle agitation for even distribution. Recipe presets make it easy to switch between product formulas without manual recalculation.', ar: 'تُجرَّع المكونات وتُخلط في وعاء خلط من الفولاذ المقاوم للصدأ بنسب محكومة بالوصفة من المحلول الملحي والملح والحمض والتوابل، ثم تُحفظ تحت تحريك لطيف لضمان توزيع متساوٍ. تُسهّل إعدادات الوصفة المحفوظة التبديل بين تركيبات المنتج دون إعادة حساب يدوية.' },
      applications: [
        { icon: 'bi-sliders', title: { en: 'Recipe-Controlled Dosing', ar: 'تجريع محكوم بالوصفة' }, text: { en: 'Ingredients dose automatically to a saved formula.', ar: 'تُجرَّع المكونات تلقائيًا وفق تركيبة محفوظة.' } },
        { icon: 'bi-arrow-repeat', title: { en: 'Continuous Agitation', ar: 'تحريك مستمر' }, text: { en: 'Gentle mixing keeps brine concentration even throughout.', ar: 'يحافظ الخلط اللطيف على تركيز محلول ملحي متساوٍ في كل مكان.' } },
        { icon: 'bi-arrow-left-right', title: { en: 'Formula Preset Switching', ar: 'تبديل إعدادات التركيبة' }, text: { en: 'Swap between product recipes without manual recalculation.', ar: 'التبديل بين وصفات المنتج دون إعادة حساب يدوية.' } },
      ],
      advantages: [
        { icon: 'bi-shield-check', title: { en: 'Consistent Flavor Profile', ar: 'نكهة ثابتة' }, text: { en: 'Every batch holds the same brine formula.', ar: 'تحافظ كل دفعة على نفس تركيبة المحلول الملحي.' } },
        { icon: 'bi-cpu-fill', title: { en: 'Reduced Manual Dosing Error', ar: 'تقليل خطأ التجريع اليدوي' }, text: { en: 'Automated dosing removes guesswork from every batch.', ar: 'يزيل التجريع الآلي التخمين من كل دفعة.' } },
        { icon: 'bi-speedometer2', title: { en: 'Fast Recipe Changeover', ar: 'تبديل سريع للوصفة' }, text: { en: 'Saved presets switch formulas in minutes, not hours.', ar: 'تُبدّل الإعدادات المحفوظة التركيبات في دقائق لا ساعات.' } },
      ],
      capacity: '1,000 – 5,000 L/batch',
      badges: ['Automation', 'Material'],
    },
  ];

  function bySlug(slug) {
    return data.find((c) => c.slug === slug) || null;
  }

  function productCount(slug) {
    if (!window.PitexProducts) return 0;
    return window.PitexProducts.data.filter((p) => p.category === slug).length;
  }

  /**
   * The one place category-card HTML is authored. production-lines.js
   * calls this to render the 6-card grid — never write out card markup
   * by hand elsewhere.
   */
  function renderCategoryCard(cat, index) {
    const pick = window.I18N && window.I18N.pick ? window.I18N.pick : (v) => (typeof v === 'string' ? v : v.en);
    const t = window.I18N && window.I18N.t ? window.I18N.t : (key) => key;
    const count = productCount(cat.slug);
    const label = pick(cat.label);
    const shortDesc = pick(cat.shortDesc);
    const countLabel = count === 1
      ? t('common.misc.productLineSingular', { count })
      : t('common.misc.productLinePlural', { count });

    return `
      <a
        href="products.html?category=${cat.slug}"
        class="category-card gsap-stagger-item"
        data-category-card
        data-category-slug="${cat.slug}"
        aria-label="Explore ${label} — ${countLabel}"
        style="--card-index:${index}"
      >
        <div class="category-card__media">
          <img src="${cat.image}" alt="${cat.alt}" loading="lazy" width="640" height="800" />
          <div class="category-card__overlay" aria-hidden="true"></div>
          <div class="card-sweep" aria-hidden="true"></div>
        </div>

        <span class="category-card__icon" aria-hidden="true"><i class="bi ${cat.icon}"></i></span>
        <span class="category-card__count">${countLabel}</span>

        <div class="category-card__body">
          <h3 class="category-card__title">${label}</h3>
          <p class="category-card__desc">${shortDesc}</p>
          <span class="link-arrow link-arrow--light category-card__link">
            ${t('common.buttons.exploreCategory')}
            <i class="bi bi-arrow-right" aria-hidden="true" data-rtl-flip></i>
          </span>
        </div>
      </a>`;
  }

  return { data, bySlug, productCount, renderCategoryCard };
})();
