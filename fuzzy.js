function FuzzyHargaMurah(x) {
    if (x < 10749000) {
        return 1;
    } else if (x > 34509000) {
        return 0;
    }
    return (34509000 - x) / (34509000 - 10749000);
}

function FuzzyHargaMahal(x) {
    if (x < 10749000) {
        return 0;
    } else if (x > 34509000) {
        return 1;
    }
    return (x - 10749000) / (34509000 - 10749000);
}

function FuzzyRAMKecil(x) {
    if (x < 12) {
        return 1;
    } else if (x > 64) {
        return 0;
    }
    return (64 - x) / (64 - 12);
}

function FuzzyRAMBesar(x) {
    if (x < 12) {
        return 0;
    } else if (x > 64) {
        return 1;
    }
    return (x - 12) / (64 - 12);
}


function FuzzyPenyimpananKecil(x) {
    if (x < 512) {
        return 1;
    } else if (x > 1000) {
        return 0;
    }
    return (1000 - x) / (1000 - 512);
}

function FuzzyPenyimpananBesar(x) {
    if (x < 512) {
        return 0;
    } else if (x > 1000) {
        return 1;
    }
    return (x - 512) / (1000 - 512);
}


function FuzzyDayaTahanBateraiPendek(x) {
    if (x < 49) {
        return 1;
    } else if (x > 90) {
        return 0;
    }
    return (90 - x) / (90 - 49);
}

function FuzzyDayaTahanBateraiLama(x) {
    if (x < 49) {
        return 0;
    } else if (x > 90) {
        return 1;
    }
    return (x - 49) / (90 - 49);
}


function FuzzyBeratRingan(x) {
    if (x < 2) {
        return 1;
    } else if (x > 3) {
        return 0;
    }
    return (3 - x) / (3 - 2);
}

function FuzzyBeratBerat(x) {
    if (x < 2) {
        return 0;
    } else if (x > 3) {
        return 1;
    }
    return (x - 2) / (3 - 2);
}

function ZTidakRekomendasi(x) {

    if (x >= 1) {
        return 0;
    } else if (x <= 0) {
        return 50;
    }
    return -((x * (50 - 0)) - 50);
}

function ZCukupRekomendasi(x) {

    if (x >= 1) {
        return 60;
    } else if (x <= 0) {
        return 80;
    }

    return -((x * (80 - 60)) - 80);
}

function ZSangatRekomendasi(x) {

    if (x >= 1) {
        return 100;
    } else if (x <= 0) {
        return 70;
    }
    return (x * (100 - 70)) + 70;
}

module.exports = function (harga, RAM, penyimpanan, daya_tahan_baterai, berat) {
    let alpa_aturan1 = Math.max(
        FuzzyHargaMurah(harga),
        FuzzyRAMBesar(RAM),
        FuzzyPenyimpananBesar(penyimpanan),
        FuzzyDayaTahanBateraiLama(daya_tahan_baterai),
        FuzzyBeratRingan(berat)
    );
    let alpa_aturan2 = Math.max(
        FuzzyHargaMurah(harga),
        FuzzyRAMBesar(RAM),
        FuzzyPenyimpananBesar(penyimpanan),
        FuzzyDayaTahanBateraiLama(daya_tahan_baterai),
        FuzzyBeratBerat(berat)
    );
    let alpa_aturan3 = Math.max(
        FuzzyHargaMahal(harga),
        FuzzyRAMBesar(RAM),
        FuzzyPenyimpananBesar(penyimpanan),
        FuzzyDayaTahanBateraiLama(daya_tahan_baterai),
        FuzzyBeratRingan(berat)
    );
    let alpa_aturan4 = Math.max(
        FuzzyHargaMurah(harga),
        FuzzyRAMKecil(RAM),
        FuzzyPenyimpananKecil(penyimpanan),
        FuzzyDayaTahanBateraiPendek(daya_tahan_baterai),
        FuzzyBeratBerat(berat)
    );
    let alpa_aturan5 = Math.max(
        FuzzyHargaMahal(harga),
        FuzzyRAMKecil(RAM),
        FuzzyPenyimpananKecil(penyimpanan),
        FuzzyDayaTahanBateraiPendek(daya_tahan_baterai),
        FuzzyBeratBerat(berat)
    );
    let alpa_aturan6 = Math.max(
        FuzzyHargaMurah(harga),
        FuzzyRAMBesar(RAM),
        FuzzyPenyimpananBesar(penyimpanan),
        FuzzyDayaTahanBateraiPendek(daya_tahan_baterai),
        FuzzyBeratRingan(berat)
    );
    let alpa_aturan7 = Math.max(
        FuzzyHargaMahal(harga),
        FuzzyRAMKecil(RAM),
        FuzzyPenyimpananBesar(penyimpanan),
        FuzzyDayaTahanBateraiLama(daya_tahan_baterai),
        FuzzyBeratBerat(berat)
    );

    let total_alpa_z = ZSangatRekomendasi(alpa_aturan1) * alpa_aturan1 + ZSangatRekomendasi(alpa_aturan2) * alpa_aturan2 + ZSangatRekomendasi(alpa_aturan3) * alpa_aturan3 + ZTidakRekomendasi(alpa_aturan4) * alpa_aturan4 + ZTidakRekomendasi(alpa_aturan5) * alpa_aturan5 + ZCukupRekomendasi(alpa_aturan6) * alpa_aturan6 + ZCukupRekomendasi(alpa_aturan7) * alpa_aturan7;
    let total_alpa = alpa_aturan1 + alpa_aturan2 + alpa_aturan3 + alpa_aturan4 + alpa_aturan5 + alpa_aturan6 + alpa_aturan7;
    let Z = total_alpa_z / total_alpa;
    return Z;
}