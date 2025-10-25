export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // Temporary fallback due to Gemini API rate limits
    const responses = {
      'واجهة': 'معايير الواجهات النجدية:\n- نسبة النوافذ 15-25% من مساحة الجدار\n- استخدام الحجر المحلي والطين\n- عناصر الحماية من الشمس (مشربيات)\n- الألوان الترابية والبيجة\n- المداخل المنخفضة والأفنية الداخلية',
      'نوافذ': 'معايير النوافذ:\n- نسبة WWR لا تتجاوز 25%\n- زجاج مزدوج للعزل الحراري\n- مظلات خارجية للواجهات الجنوبية والغربية\n- فتحات علوية للتهوية الطبيعية',
      'najdi': 'Najdi architectural facade standards:\n- Window-to-wall ratio (WWR): 15-25%\n- Use of local stone and clay materials\n- Sun protection elements (mashrabiya)\n- Earth-tone and beige colors\n- Low entrances and internal courtyards'
    };
    
    for (const [keyword, response] of Object.entries(responses)) {
      if (message.toLowerCase().includes(keyword)) {
        return new Response(response);
      }
    }
    
    return new Response(`تحليل معماري للاستعلام: "${message}"\n\nيتطلب مراجعة المعايير التالية:\n- الهوية المعمارية (نجدية/حجازية/عسيرية)\n- المناخ والبيئة المحلية\n- السياق العمراني\n- الوظيفة والاستخدام\n\nملاحظة: خدمة الذكاء الاصطناعي مؤقتاً غير متاحة بسبب حدود الاستخدام.`);
    
  } catch (error) {
    return new Response(`خطأ: ${error.message}`, { status: 500 });
  }
}