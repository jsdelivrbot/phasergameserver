-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: May 16, 2015 at 03:36 PM
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
-- Table structure for table `chunks`
--

CREATE TABLE IF NOT EXISTS `chunks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `map` int(11) NOT NULL,
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL,
  `data` mediumtext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=22 ;

-- --------------------------------------------------------

--
-- Table structure for table `errors`
--

CREATE TABLE IF NOT EXISTS `errors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app` text NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `message` text NOT NULL,
  `file` text NOT NULL,
  `line` text NOT NULL,
  `stack` text NOT NULL,
  `count` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Triggers `errors`
--
DROP TRIGGER IF EXISTS `update date`;
DELIMITER //
CREATE TRIGGER `update date` BEFORE UPDATE ON `errors`
 FOR EACH ROW BEGIN
    SET NEW.date = CURRENT_TIMESTAMP;
END
//
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `layers`
--

CREATE TABLE IF NOT EXISTS `layers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `level` int(11) NOT NULL,
  `abovePlayer` tinyint(1) NOT NULL DEFAULT '0',
  `visibleInGame` tinyint(1) NOT NULL DEFAULT '1',
  `collision` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

-- --------------------------------------------------------

--
-- Table structure for table `maps`
--

CREATE TABLE IF NOT EXISTS `maps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `desc` text NOT NULL,
  `width` int(11) NOT NULL,
  `height` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Triggers `maps`
--
DROP TRIGGER IF EXISTS `delete chunks`;
DELIMITER //
CREATE TRIGGER `delete chunks` BEFORE DELETE ON `maps`
 FOR EACH ROW DELETE FROM `chunks` WHERE map = OLD.id
//
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `object-door`
--

CREATE TABLE IF NOT EXISTS `object-door` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL,
  `map` int(11) NOT NULL,
  `width` int(11) NOT NULL,
  `height` int(11) NOT NULL,
  `properties` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=37 ;

-- --------------------------------------------------------

--
-- Table structure for table `object-mappoint`
--

CREATE TABLE IF NOT EXISTS `object-mappoint` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL,
  `map` int(11) NOT NULL,
  `width` int(11) NOT NULL,
  `height` int(11) NOT NULL,
  `properties` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

-- --------------------------------------------------------

--
-- Table structure for table `templates`
--

CREATE TABLE IF NOT EXISTS `templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `data` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

-- --------------------------------------------------------

--
-- Table structure for table `tiles`
--

CREATE TABLE IF NOT EXISTS `tiles` (
  `id` int(11) NOT NULL,
  `blank` tinyint(1) NOT NULL,
  `collision` tinyint(1) NOT NULL,
  `collisionInfo` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user-data`
--

CREATE TABLE IF NOT EXISTS `user-data` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `health` int(11) NOT NULL DEFAULT '1000',
  `inventory` text NOT NULL,
  `image` text NOT NULL,
  `map` int(11) NOT NULL,
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` text NOT NULL,
  `name` text NOT NULL,
  `password` text NOT NULL,
  `admin` tinyint(1) NOT NULL DEFAULT '0',
  `banned` tinyint(1) NOT NULL DEFAULT '0',
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastOn` timestamp NOT NULL,
  `health` int(11) NOT NULL DEFAULT '1000',
  `image` text NOT NULL,
  `map` int(11) NOT NULL DEFAULT '0',
  `x` int(11) NOT NULL DEFAULT '0',
  `y` int(11) NOT NULL DEFAULT '0',
  `inventory` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Triggers `users`
--
DROP TRIGGER IF EXISTS `player_last_on`;
DELIMITER //
CREATE TRIGGER `player_last_on` BEFORE UPDATE ON `users`
 FOR EACH ROW BEGIN
    SET NEW.lastOn = CURRENT_TIMESTAMP;
END
//
DELIMITER ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
