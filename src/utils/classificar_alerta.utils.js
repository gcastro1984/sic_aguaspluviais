export function classificarAlerta({ water, rain6h, forecast1h }) {

    let nivel = 1; // Verde

    if (water >= 90 || rain6h > 60 || forecast1h > 40) {
        nivel = 4; // Vermelho
    }
    else if (water >= 85 || rain6h >= 41 || forecast1h >= 21) {
        nivel = 3; // Laranja
    }
    else if (water >= 70 || rain6h >= 30 || forecast1h >= 10) {
        nivel = 2; // Amarelo
    }

    return nivel;
}