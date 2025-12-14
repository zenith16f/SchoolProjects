-- CreateTable
CREATE TABLE `usuarios` (
    `idUsuario` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `usuarios_username_key`(`username`),
    UNIQUE INDEX `usuarios_email_key`(`email`),
    INDEX `usuarios_email_idx`(`email`),
    INDEX `usuarios_username_idx`(`username`),
    PRIMARY KEY (`idUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuentas` (
    `idCuenta` INTEGER NOT NULL AUTO_INCREMENT,
    `idUsuario` INTEGER NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `tipo` ENUM('banco', 'efectivo', 'tarjeta_debito', 'tarjeta_credito', 'ahorro') NOT NULL,
    `saldoInicial` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `saldoActual` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `moneda` ENUM('MXN', 'USD', 'EUR', 'CAD') NOT NULL DEFAULT 'MXN',
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cuentas_idUsuario_idx`(`idUsuario`),
    INDEX `cuentas_activa_idx`(`activa`),
    INDEX `cuentas_idUsuario_activa_idx`(`idUsuario`, `activa`),
    PRIMARY KEY (`idCuenta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `idCategoria` INTEGER NOT NULL AUTO_INCREMENT,
    `idUsuario` INTEGER NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `tipo` ENUM('ingreso', 'egreso') NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `color` VARCHAR(20) NOT NULL DEFAULT '#6B7280',
    `icono` ENUM('dollar', 'briefcase', 'trending_up', 'piggy_bank', 'shopping_cart', 'utensils', 'coffee', 'car', 'bus', 'home', 'zap', 'wrench', 'tv', 'gamepad', 'ticket', 'heart', 'dumbbell', 'book', 'shopping_bag', 'smartphone', 'more_horizontal') NOT NULL DEFAULT 'dollar',
    `activa` BOOLEAN NOT NULL DEFAULT true,

    INDEX `categorias_idUsuario_tipo_idx`(`idUsuario`, `tipo`),
    INDEX `categorias_activa_idx`(`activa`),
    PRIMARY KEY (`idCategoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transacciones` (
    `idTransaccion` INTEGER NOT NULL AUTO_INCREMENT,
    `idUsuario` INTEGER NOT NULL,
    `idCuenta` INTEGER NOT NULL,
    `idCategoria` INTEGER NOT NULL,
    `monto` DECIMAL(15, 2) NOT NULL,
    `descripcion` VARCHAR(200) NOT NULL,
    `fecha` DATE NOT NULL,
    `notas` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `transacciones_idUsuario_fecha_idx`(`idUsuario`, `fecha` DESC),
    INDEX `transacciones_idCuenta_idx`(`idCuenta`),
    INDEX `transacciones_idCategoria_idx`(`idCategoria`),
    INDEX `transacciones_fecha_idx`(`fecha`),
    PRIMARY KEY (`idTransaccion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metas_ahorro` (
    `idMeta` INTEGER NOT NULL AUTO_INCREMENT,
    `idUsuario` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `montoObjetivo` DECIMAL(15, 2) NOT NULL,
    `montoActual` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `fechaInicio` DATE NOT NULL,
    `fechaLimite` DATE NULL,
    `completada` BOOLEAN NOT NULL DEFAULT false,

    INDEX `metas_ahorro_idUsuario_completada_idx`(`idUsuario`, `completada`),
    INDEX `metas_ahorro_fechaLimite_idx`(`fechaLimite`),
    PRIMARY KEY (`idMeta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aportaciones` (
    `idAportacion` INTEGER NOT NULL AUTO_INCREMENT,
    `idMeta` INTEGER NOT NULL,
    `descripcion` VARCHAR(200) NULL,
    `monto` DECIMAL(15, 2) NOT NULL,
    `metodo` VARCHAR(100) NULL,
    `fechaAporte` DATE NOT NULL,

    INDEX `aportaciones_idMeta_fechaAporte_idx`(`idMeta`, `fechaAporte` DESC),
    PRIMARY KEY (`idAportacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cuentas` ADD CONSTRAINT `cuentas_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categorias` ADD CONSTRAINT `categorias_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transacciones` ADD CONSTRAINT `transacciones_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transacciones` ADD CONSTRAINT `transacciones_idCuenta_fkey` FOREIGN KEY (`idCuenta`) REFERENCES `cuentas`(`idCuenta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transacciones` ADD CONSTRAINT `transacciones_idCategoria_fkey` FOREIGN KEY (`idCategoria`) REFERENCES `categorias`(`idCategoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metas_ahorro` ADD CONSTRAINT `metas_ahorro_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aportaciones` ADD CONSTRAINT `aportaciones_idMeta_fkey` FOREIGN KEY (`idMeta`) REFERENCES `metas_ahorro`(`idMeta`) ON DELETE CASCADE ON UPDATE CASCADE;
