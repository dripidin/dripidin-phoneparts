-- HamzaPhone Migration 00009: 58 Algerian Wilayas & Delivery Rate Baseline Seed

INSERT INTO public.wilayas (code, name_fr, name_ar, zone, is_active)
VALUES
    (1, 'Adrar', 'أدرار', 'GRAND_SUD', true),
    (2, 'Chlef', 'الشلف', 'NORD', true),
    (3, 'Laghouat', 'الأغواط', 'HAUTS_PLATEAUX', true),
    (4, 'Oum El Bouaghi', 'أم البواقي', 'HAUTS_PLATEAUX', true),
    (5, 'Batna', 'باتنة', 'HAUTS_PLATEAUX', true),
    (6, 'Béjaïa', 'بجاية', 'NORD', true),
    (7, 'Biskra', 'بسكرة', 'HAUTS_PLATEAUX', true),
    (8, 'Béchar', 'بشار', 'SUD', true),
    (9, 'Blida', 'البليدة', 'NORD', true),
    (10, 'Bouira', 'البويرة', 'NORD', true),
    (11, 'Tamanrasset', 'تمنراست', 'GRAND_SUD', true),
    (12, 'Tébessa', 'تبسة', 'HAUTS_PLATEAUX', true),
    (13, 'Tlemcen', 'تلمسان', 'NORD', true),
    (14, 'Tiaret', 'تيارت', 'HAUTS_PLATEAUX', true),
    (15, 'Tizi Ouzou', 'تيزي وزو', 'NORD', true),
    (16, 'Alger', 'الجزائر', 'NORD', true),
    (17, 'Djelfa', 'الجلفة', 'HAUTS_PLATEAUX', true),
    (18, 'Jijel', 'جيجل', 'NORD', true),
    (19, 'Sétif', 'سطيف', 'HAUTS_PLATEAUX', true),
    (20, 'Saïda', 'سعيدة', 'HAUTS_PLATEAUX', true),
    (21, 'Skikda', 'سكيكدة', 'NORD', true),
    (22, 'Sidi Bel Abbès', 'سيدي بلعباس', 'NORD', true),
    (23, 'Annaba', 'عنابة', 'NORD', true),
    (24, 'Guelma', 'قالمة', 'NORD', true),
    (25, 'Constantine', 'قسنطينة', 'NORD', true),
    (26, 'Médéa', 'المدية', 'NORD', true),
    (27, 'Mostaganem', 'مستغانم', 'NORD', true),
    (28, 'M''Sila', 'المسيلة', 'HAUTS_PLATEAUX', true),
    (29, 'Mascara', 'معسكر', 'NORD', true),
    (30, 'Ouargla', 'ورقلة', 'SUD', true),
    (31, 'Oran', 'وهران', 'NORD', true),
    (32, 'El Bayadh', 'البيض', 'HAUTS_PLATEAUX', true),
    (33, 'Illizi', 'إليزي', 'GRAND_SUD', true),
    (34, 'Bordj Bou Arréridj', 'برج بوعريريج', 'HAUTS_PLATEAUX', true),
    (35, 'Boumerdès', 'بومرداس', 'NORD', true),
    (36, 'El Tarf', 'الطارف', 'NORD', true),
    (37, 'Tindouf', 'تندوف', 'GRAND_SUD', true),
    (38, 'Tissemsilt', 'تيسمسيلت', 'HAUTS_PLATEAUX', true),
    (39, 'El Oued', 'الوادي', 'SUD', true),
    (40, 'Khenchela', 'خنشلة', 'HAUTS_PLATEAUX', true),
    (41, 'Souk Ahras', 'سوق أهراس', 'HAUTS_PLATEAUX', true),
    (42, 'Tipaza', 'تيبازة', 'NORD', true),
    (43, 'Mila', 'ميلة', 'NORD', true),
    (44, 'Aïn Defla', 'عين الدفلى', 'NORD', true),
    (45, 'Naâma', 'النعامة', 'HAUTS_PLATEAUX', true),
    (46, 'Aïn Témouchent', 'عين تموشنت', 'NORD', true),
    (47, 'Ghardaïa', 'غرداية', 'SUD', true),
    (48, 'Relizane', 'غليزان', 'NORD', true),
    (49, 'Timimoun', 'تيميمون', 'GRAND_SUD', true),
    (50, 'Bordj Badji Mokhtar', 'برج باجي مختار', 'GRAND_SUD', true),
    (51, 'Ouled Djellal', 'أولاد جلال', 'HAUTS_PLATEAUX', true),
    (52, 'Béni Abbès', 'بني عباس', 'GRAND_SUD', true),
    (53, 'In Salah', 'عين صالح', 'GRAND_SUD', true),
    (54, 'In Guezzam', 'عين قزام', 'GRAND_SUD', true),
    (55, 'Touggourt', 'تقرت', 'SUD', true),
    (56, 'Djanet', 'جانت', 'GRAND_SUD', true),
    (57, 'El M''Ghair', 'المغير', 'SUD', true),
    (58, 'El Meniaa', 'المنيعة', 'SUD', true)
ON CONFLICT (code) DO UPDATE SET 
    name_fr = EXCLUDED.name_fr,
    name_ar = EXCLUDED.name_ar,
    zone = EXCLUDED.zone;

-- Seed EcoTrack Delivery Rates Matrix across all 58 Wilayas
INSERT INTO public.delivery_rate_matrix (wilaya_code, courier_code, home_delivery_dzd, stopdesk_delivery_dzd, estimated_days_min, estimated_days_max, free_shipping_threshold_dzd)
SELECT 
    w.code,
    'ECOTRACK',
    CASE 
        WHEN w.code = 16 THEN 400.00 -- Alger
        WHEN w.zone = 'NORD' THEN 600.00
        WHEN w.zone = 'HAUTS_PLATEAUX' THEN 750.00
        WHEN w.zone = 'SUD' THEN 900.00
        WHEN w.zone = 'GRAND_SUD' THEN 1300.00
        ELSE 600.00
    END AS home_delivery_dzd,
    CASE 
        WHEN w.code = 16 THEN 250.00 -- Alger
        WHEN w.zone = 'NORD' THEN 400.00
        WHEN w.zone = 'HAUTS_PLATEAUX' THEN 550.00
        WHEN w.zone = 'SUD' THEN 700.00
        WHEN w.zone = 'GRAND_SUD' THEN 950.00
        ELSE 400.00
    END AS stopdesk_delivery_dzd,
    CASE 
        WHEN w.code = 16 THEN 1
        WHEN w.zone = 'NORD' THEN 1
        WHEN w.zone = 'HAUTS_PLATEAUX' THEN 2
        WHEN w.zone = 'SUD' THEN 3
        WHEN w.zone = 'GRAND_SUD' THEN 4
        ELSE 2
    END AS estimated_days_min,
    CASE 
        WHEN w.code = 16 THEN 1
        WHEN w.zone = 'NORD' THEN 2
        WHEN w.zone = 'HAUTS_PLATEAUX' THEN 3
        WHEN w.zone = 'SUD' THEN 5
        WHEN w.zone = 'GRAND_SUD' THEN 7
        ELSE 4
    END AS estimated_days_max,
    CASE 
        WHEN w.zone = 'NORD' THEN 20000.00
        ELSE NULL -- No automatic free shipping for Sud/Grand Sud
    END AS free_shipping_threshold_dzd
FROM public.wilayas w
ON CONFLICT (wilaya_code, courier_code) DO NOTHING;
