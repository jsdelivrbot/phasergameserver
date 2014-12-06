-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Dec 06, 2014 at 01:39 AM
-- Server version: 5.6.17
-- PHP Version: 5.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `phasergame`
--

-- --------------------------------------------------------

--
-- Table structure for table `islands`
--

CREATE TABLE IF NOT EXISTS `islands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `islands`
--

INSERT INTO `islands` (`id`, `name`) VALUES
(0, 'home');

-- --------------------------------------------------------

--
-- Table structure for table `maps`
--

CREATE TABLE IF NOT EXISTS `maps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `island` int(11) NOT NULL,
  `url` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

--
-- Dumping data for table `maps`
--

INSERT INTO `maps` (`id`, `island`, `url`) VALUES
(0, 0, 'maps/island_1/island_1.json'),
(1, 0, 'maps/island_1/room_1.json'),
(2, 0, 'maps/island_1/room_2.json'),
(3, 0, 'maps/island_1/room_3.json'),
(4, 0, 'maps/island_1/room_4.json'),
(5, 0, 'maps/island_1/room_5.json'),
(6, 0, 'maps/island_1/room_6.json'),
(7, 0, 'maps/island_1/room_7.json'),
(8, 0, 'maps/island_1/room_8.json');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `name` text NOT NULL,
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL,
  `island` int(11) NOT NULL,
  `map` int(11) NOT NULL,
  `image` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `name`, `x`, `y`, `island`, `map`, `image`) VALUES
(1, 'account1@gmail.com', 'password', 'account1', 0, 0, 0, 0, 'player/1'),
(2, 'account2@gmail.com', 'password', 'account2', 0, 0, 0, 0, 'player/1'),
(3, 'account3@gmail.com', 'password', 'account3', 0, 0, 0, 0, 'player/1');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
