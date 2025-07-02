-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 27 juin 2025 à 13:12
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `gamezonemanager`
--

-- --------------------------------------------------------

--
-- Structure de la table `admin`
--

CREATE TABLE `admin` (
  `id_admin` int(11) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `admin`
--

INSERT INTO `admin` (`id_admin`, `email`, `password`, `nom`, `prenom`, `created_at`, `updated_at`) VALUES
(1, 'admin@gamezone.com', '$2b$10$y5ITziVqO8WYPCW5MJYWk.JJyBWW4HXGA3iSMlbdF0jlLMNBvBYNm', 'Admin', 'GameZone', '2025-06-25 20:01:11', '2025-06-25 20:01:11');

-- --------------------------------------------------------

--
-- Structure de la table `bureau`
--

CREATE TABLE `bureau` (
  `id_station` int(11) NOT NULL,
  `config_pc` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `client`
--

CREATE TABLE `client` (
  `id_client` int(11) NOT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `client`
--

INSERT INTO `client` (`id_client`, `nom`, `prenom`, `email`) VALUES
(1, 'Dikete', 'Timothée', 'diketetimothee2@gmail.com');

-- --------------------------------------------------------

--
-- Structure de la table `client_reservation`
--

CREATE TABLE `client_reservation` (
  `id_client` int(11) NOT NULL,
  `id_reservation` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `client_reservation`
--

INSERT INTO `client_reservation` (`id_client`, `id_reservation`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `espaceconsole`
--

CREATE TABLE `espaceconsole` (
  `id_station` int(11) NOT NULL,
  `nombre_manettes` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `espaceconsole`
--

INSERT INTO `espaceconsole` (`id_station`, `nombre_manettes`) VALUES
(1, 2);

-- --------------------------------------------------------

--
-- Structure de la table `reservation`
--

CREATE TABLE `reservation` (
  `id_reservation` int(11) NOT NULL,
  `date_reservation` datetime NOT NULL,
  `id_station` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `reservation`
--

INSERT INTO `reservation` (`id_reservation`, `date_reservation`, `id_station`) VALUES
(1, '2025-06-25 00:09:00', 1);

-- --------------------------------------------------------

--
-- Structure de la table `sessiondejeu`
--

CREATE TABLE `sessiondejeu` (
  `id_session` int(11) NOT NULL,
  `debut_session` datetime NOT NULL,
  `fin_session` datetime DEFAULT NULL,
  `id_reservation` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `sessiondejeu`
--

INSERT INTO `sessiondejeu` (`id_session`, `debut_session`, `fin_session`, `id_reservation`) VALUES
(1, '2025-06-25 23:10:04', '2025-06-25 23:10:25', 1);

-- --------------------------------------------------------

--
-- Structure de la table `stationjeu`
--

CREATE TABLE `stationjeu` (
  `id_station` int(11) NOT NULL,
  `plateforme` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `stationjeu`
--

INSERT INTO `stationjeu` (`id_station`, `plateforme`) VALUES
(1, 'Console');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id_admin`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `bureau`
--
ALTER TABLE `bureau`
  ADD PRIMARY KEY (`id_station`);

--
-- Index pour la table `client`
--
ALTER TABLE `client`
  ADD PRIMARY KEY (`id_client`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `client_reservation`
--
ALTER TABLE `client_reservation`
  ADD PRIMARY KEY (`id_client`,`id_reservation`),
  ADD KEY `id_reservation` (`id_reservation`);

--
-- Index pour la table `espaceconsole`
--
ALTER TABLE `espaceconsole`
  ADD PRIMARY KEY (`id_station`);

--
-- Index pour la table `reservation`
--
ALTER TABLE `reservation`
  ADD PRIMARY KEY (`id_reservation`),
  ADD KEY `id_station` (`id_station`);

--
-- Index pour la table `sessiondejeu`
--
ALTER TABLE `sessiondejeu`
  ADD PRIMARY KEY (`id_session`),
  ADD KEY `id_reservation` (`id_reservation`);

--
-- Index pour la table `stationjeu`
--
ALTER TABLE `stationjeu`
  ADD PRIMARY KEY (`id_station`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `admin`
--
ALTER TABLE `admin`
  MODIFY `id_admin` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `client`
--
ALTER TABLE `client`
  MODIFY `id_client` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `reservation`
--
ALTER TABLE `reservation`
  MODIFY `id_reservation` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `sessiondejeu`
--
ALTER TABLE `sessiondejeu`
  MODIFY `id_session` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `stationjeu`
--
ALTER TABLE `stationjeu`
  MODIFY `id_station` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `bureau`
--
ALTER TABLE `bureau`
  ADD CONSTRAINT `bureau_ibfk_1` FOREIGN KEY (`id_station`) REFERENCES `stationjeu` (`id_station`) ON DELETE CASCADE;

--
-- Contraintes pour la table `client_reservation`
--
ALTER TABLE `client_reservation`
  ADD CONSTRAINT `client_reservation_ibfk_1` FOREIGN KEY (`id_client`) REFERENCES `client` (`id_client`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_reservation_ibfk_2` FOREIGN KEY (`id_reservation`) REFERENCES `reservation` (`id_reservation`) ON DELETE CASCADE;

--
-- Contraintes pour la table `espaceconsole`
--
ALTER TABLE `espaceconsole`
  ADD CONSTRAINT `espaceconsole_ibfk_1` FOREIGN KEY (`id_station`) REFERENCES `stationjeu` (`id_station`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reservation`
--
ALTER TABLE `reservation`
  ADD CONSTRAINT `reservation_ibfk_1` FOREIGN KEY (`id_station`) REFERENCES `stationjeu` (`id_station`) ON DELETE CASCADE;

--
-- Contraintes pour la table `sessiondejeu`
--
ALTER TABLE `sessiondejeu`
  ADD CONSTRAINT `sessiondejeu_ibfk_1` FOREIGN KEY (`id_reservation`) REFERENCES `reservation` (`id_reservation`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
